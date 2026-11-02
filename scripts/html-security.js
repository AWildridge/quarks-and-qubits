import { parse } from 'parse5';
import { hashCsp } from './security-policy.js';

export function walkNodes(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walkNodes(child, visit);
  if (node.content) walkNodes(node.content, visit);
}

export function inlineHashes(html) {
  const scripts = new Set();
  const styles = new Set();
  const attributes = new Set();
  walkNodes(parse(html), (node) => {
    const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
    const content = (node.childNodes || [])
      .filter((n) => n.nodeName === '#text')
      .map((n) => n.value)
      .join('');
    if (node.tagName === 'script' && !attrs.src && content.trim()) scripts.add(hashCsp(content));
    if (node.tagName === 'style' && content.trim()) styles.add(hashCsp(content));
    if (attrs.style) attributes.add(hashCsp(attrs.style));
  });
  return { scripts, styles, attributes };
}
