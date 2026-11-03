import contextlib
import importlib.util
import io
import os
import socket
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

spec = importlib.util.spec_from_file_location(
    "diagnose_cern", Path(__file__).resolve().parents[1] / "scripts/diagnose-cern.py"
)
diagnose = importlib.util.module_from_spec(spec)
spec.loader.exec_module(diagnose)


class DiagnosticTests(unittest.TestCase):
    def test_dav_success_requires_a_successful_property_status(self):
        for property_status, expected in ((200, True), (403, False)):
            connection = MagicMock()
            connection.getresponse.return_value.status = 207
            connection.getresponse.return_value.read.return_value = (
                f'<d:multistatus xmlns:d="DAV:"><d:response><d:propstat>'
                f'<d:status>HTTP/1.1 {property_status} Result</d:status>'
                f'</d:propstat></d:response></d:multistatus>'
            ).encode()
            with patch.object(diagnose.http.client, "HTTPSConnection", return_value=connection):
                self.assertEqual(diagnose.probe("example.test", "/www/", "Basic secret")[0], expected)
            args, kwargs = connection.request.call_args
            self.assertEqual(args[0], "PROPFIND")
            self.assertEqual(kwargs["headers"]["Depth"], "0")
            connection.close.assert_called_once()

    def test_redirects_are_not_followed_and_server_text_is_not_logged(self):
        connection = MagicMock()
        connection.getresponse.return_value.status = 302
        connection.getresponse.return_value.reason = "sensitive server text"
        with patch.object(diagnose.http.client, "HTTPSConnection", return_value=connection):
            readable, message = diagnose.probe("example.test", "/www/", "Basic secret")
        self.assertFalse(readable)
        self.assertEqual(message, "HTTP 302; redirect refused")
        connection.request.assert_called_once()

    def test_dns_failure_is_reported_without_exception_details(self):
        connection = MagicMock()
        connection.request.side_effect = socket.gaierror("sensitive details")
        with patch.object(diagnose.http.client, "HTTPSConnection", return_value=connection):
            readable, message = diagnose.probe("example.test", "/www/", "Basic secret")
        self.assertFalse(readable)
        self.assertIn("DNS lookup failed", message)
        self.assertNotIn("sensitive", message)

    def test_report_reveals_neither_credentials_nor_remote_paths(self):
        env = {"CERN_USER": "tester", "CERN_PASSWORD": "a-private-password", "EOS_PATH": "/eos/user/t/tester/www/"}
        output = io.StringIO()
        with patch.dict(os.environ, env, clear=True), patch.object(
            diagnose, "probe", side_effect=[(True, "HTTP 207"), (False, "HTTP 401"), (False, "DNS lookup failed")]
        ) as probe, contextlib.redirect_stdout(output):
            self.assertEqual(diagnose.main(), 0)
        self.assertEqual(probe.call_count, 3)
        self.assertEqual(probe.call_args_list[0].args[1], "/cernbox/webdav/eos/user/t/tester/www/")
        self.assertEqual(probe.call_args_list[1].args[1], "/remote.php/dav/files/tester/eos/user/t/tester/www/")
        for value in env.values():
            self.assertNotIn(value, output.getvalue())

    def test_all_failed_routes_and_invalid_inputs_fail_the_check(self):
        env = {"CERN_USER": "tester", "CERN_PASSWORD": "secret", "EOS_PATH": "/eos/user/t/tester/www"}
        with patch.dict(os.environ, env, clear=True), patch.object(diagnose, "probe", return_value=(False, "HTTP 401")), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(diagnose.main(), 1)
        with patch.dict(os.environ, {**env, "EOS_PATH": "/eos/user/t/tester"}, clear=True), patch.object(diagnose, "probe") as probe, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(diagnose.main(), 1)
            probe.assert_not_called()
