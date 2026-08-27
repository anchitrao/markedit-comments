"use strict";const l=require("markedit-api"),y="<!-- annotation",k="-->",de=e=>e.replace(/-->/g,"--\\>"),ue=e=>e.replace(/--\\>/g,"-->");function R(e){return e.replace(/\s+/g," ")}function B(e){const t=[];let n=0;for(;n<e.length;){const o=e.indexOf(y,n);if(o===-1)break;if(o>0&&e[o-1]!==`
`){n=o+y.length;continue}const r=me(e,o+y.length);if(r===-1)break;const i=fe(e.slice(o+y.length,r));i!==void 0&&t.push({...i,from:o,to:r+k.length}),n=r+k.length}return t}function me(e,t){let n=t;for(;n<e.length;){const o=e.indexOf(k,n);if(o===-1)return-1;const r=e.lastIndexOf(`
`,o)+1;if(e.slice(r,o).trim()==="")return o;n=o+k.length}return-1}function fe(e){const t=e.match(/\n[ \t]*\n/),n=t===null?e:e.slice(0,t.index),o=t===null?"":e.slice((t.index??0)+t[0].length),r=pe(n),i=r.get("id");if(i===void 0)return;const c=Number(r.get("line"));return{id:i,body:ue(he(o)).trim(),exact:r.get("exact")??"",prefix:r.get("prefix")??"",suffix:r.get("suffix")??"",author:r.get("author"),created:r.get("created"),line:Number.isFinite(c)?c:void 0,replyTo:r.get("reply-to"),resolved:r.get("resolved")==="true"}}function he(e){return e.replace(/\n[ \t]*$/,"")}function pe(e){const t=new Map,n=/([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;for(const o of e.matchAll(n)){const[,r,i,c]=o;if(i!==void 0)try{t.set(r,JSON.parse(`"${i}"`))}catch{t.set(r,i)}else t.set(r,c)}return t}function X(e){const t=r=>JSON.stringify(r),n=[`id=${e.id}`];e.author!==void 0&&n.push(`author=${t(e.author)}`),e.created!==void 0&&n.push(`created=${t(e.created)}`),e.line!==void 0&&n.push(`line=${e.line}`),e.replyTo!==void 0&&n.push(`reply-to=${e.replyTo}`),e.resolved===!0&&n.push("resolved=true");const o=[y,n.join(" ")];return e.replyTo===void 0&&o.push([`exact=${t(e.exact)}`,`prefix=${t(e.prefix)}`,`suffix=${t(e.suffix)}`].join(" ")),o.push("",de(e.body.trim()),k),o.join(`
`)}function ge(e){const t=new Set(e);for(let n=1;;n+=1){const o=`c${n}`;if(!t.has(o))return o}}const H=48;function ve(e,t){const n=R(t.exact);if(n.length===0)return;const o=[];for(let a=e.text.indexOf(n);a!==-1;a=e.text.indexOf(n,a+1))o.push(a);if(o.length===0)return;if(o.length===1)return{start:o[0],end:o[0]+n.length,outdated:!1};const r=R(t.prefix),i=R(t.suffix);let c=o[0],s=-1;for(const a of o){const u=e.text.slice(Math.max(0,a-r.length),a),p=e.text.slice(a+n.length,a+n.length+i.length),V=xe(u,r)+be(p,i);V>s&&(c=a,s=V)}return{start:c,end:c+n.length,outdated:!1}}function be(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[o]===t[o];)o+=1;return o}function xe(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[e.length-1-o]===t[t.length-1-o];)o+=1;return o}function ye(e,t,n){return{exact:e.text.slice(t,n),prefix:e.text.slice(Math.max(0,t-H),t),suffix:e.text.slice(n,n+H)}}const A="data-mec-ui",we=e=>/\s/.test(e);function N(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode:i=>{const c=i.parentElement;if(c===null||c.closest(`[${A}]`)!==null)return NodeFilter.FILTER_REJECT;const s=c.tagName;return s==="SCRIPT"||s==="STYLE"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),n=[],o=[],r=[];for(let i=t.nextNode();i!==null;i=t.nextNode()){const c=i,s=c.data;for(let a=0;a<s.length;a+=1){const u=s[a];if(we(u)){if(n.length===0||n[n.length-1]===" ")continue;n.push(" ")}else n.push(u);o.push(c),r.push(a)}}return{text:n.join(""),nodes:o,offsets:r}}function z(e,t,n){const o=[];for(let r=t;r<n;r+=1){const i=e.nodes[r],c=e.offsets[r];if(i===void 0)break;const s=o[o.length-1];s!==void 0&&s.node===i?s.to=c+1:o.push({node:i,from:c,to:c+1})}return o}function U(e,t,n){if(t.nodeType!==Node.TEXT_NODE){const r=e.nodes.findIndex(i=>t.contains(i));return r===-1?void 0:r}let o;for(let r=0;r<e.nodes.length;r+=1)if(e.nodes[r]===t){if(e.offsets[r]>=n)return r;o=r+1}return o}function _(e,t){const n=document.createRange();n.setStart(e.node,e.from),n.setEnd(e.node,Math.min(e.to,e.node.data.length));const o=t();return n.surroundContents(o),o}const g="data-mec-id";function ke(e,t){Ee(e);for(const n of t){const o=N(e),r=ve(o,n);if(r===void 0){Ce(e,n);continue}const c=z(o,r.start,r.end).map(s=>_(s,()=>Q(n,!1)));Z(c,n)}}function Ee(e){for(const t of e.querySelectorAll(`[${g}]`)){const n=t.parentNode;if(n!==null){for(;t.firstChild!==null;)n.insertBefore(t.firstChild,t);t.remove()}}e.normalize()}function Q(e,t){const n=document.createElement("mark");return n.className="mec-highlight",n.setAttribute(g,e.id),n.setAttribute("role","button"),n.tabIndex=0,e.resolved===!0&&n.classList.add("mec-resolved"),t&&(n.classList.add("mec-outdated"),n.title="The text this comment was written against has changed."),n}function Z(e,t){const n=e[e.length-1];n!==void 0&&(n.classList.add("mec-highlight-end"),n.setAttribute("data-mec-count",String(t.replyCount??0)))}function Ce(e,t){const n=Te(e,t.line);if(n===void 0)return;const o=N(n);if(o.text.trim().length===0)return;const i=z(o,0,o.text.length).map(c=>_(c,()=>Q(t,!0)));Z(i,t)}function Te(e,t){if(t===void 0)return;let n,o=Number.POSITIVE_INFINITY;for(const r of e.querySelectorAll("[data-line-from]")){const i=Number(r.getAttribute("data-line-from")),c=r.getAttribute("data-line-to"),s=c===null?i:Number(c);if(!Number.isFinite(i)||!Number.isFinite(s))continue;const a=t>=i&&t<=s?0:Math.min(Math.abs(t-i),Math.abs(t-s));a<o&&(n=r,o=a)}return n}function v(){return W()?B(l.MarkEdit.editorAPI.getText()):[]}function W(){return l.MarkEdit.editorView?.state!==void 0}function ee(e,t){const n=e.find(o=>o.id===t);return n===void 0?[]:[n,...e.filter(o=>o.replyTo===t)]}function I(e){return e.filter(t=>t.replyTo===void 0)}function te(e,t){const n=l.MarkEdit.editorAPI,o=n.getText(),r=B(o),i={...e,id:ge(r.map(a=>a.id))},c=Le(o,r,Ae(o,Ie(t))),s=`

${X(i)}${Ne(o,c)}`;return n.setText(s,{from:c,to:c}),i.id}function Se(e,t){const o=v().find(s=>s.id===e);if(o===void 0)return;const{from:r,to:i,...c}=o;l.MarkEdit.editorAPI.setText(X({...c,...t}),{from:r,to:i})}function ne(e){const t=l.MarkEdit.editorAPI,n=t.getText(),i=[...B(n).filter(c=>c.id===e||c.replyTo===e)].sort((c,s)=>s.from-c.from);for(const c of i){const s=n.startsWith(`

`,c.from-2)?c.from-2:c.from;t.setText("",{from:s,to:c.to})}}function Me(e){const t=v().find(n=>n.id===e);t!==void 0&&Se(e,{resolved:t.resolved!==!0})}function Ae(e,t){let n=t;for(;n>0;){const o=e.lastIndexOf(`
`,n-1)+1;if(e.slice(o,n).trim()!=="")return n;n=o===0?0:o-1}return n}function Ne(e,t){const n=e.slice(t);return n.trim().length===0||n.startsWith(`

`)?"":n.startsWith(`
`)?`
`:`

`}function Ie(e){const t=l.MarkEdit.editorAPI,n=Math.max(0,Math.min(e,t.getLineCount()-1));return t.getLineRange(n).to}function Le(e,t,n){let o=n;for(;;){const r=t.find(i=>i.from>=o&&e.slice(o,i.from).trim()==="");if(r===void 0)return o;o=r.to}}function oe(e){if(typeof e=="string"&&e.length>0)return e;try{return l.MarkEdit.getDirectoryPath("home").match(/^\/Users\/([^/]+)/)?.[1]??"me"}catch{return"me"}}const Re=`/*
 * All colors come from custom properties that \`theme.ts\` fills in by measuring
 * the editor theme, so the comment UI follows whatever theme the user has set
 * (and follows it again when they change it) rather than hard-coding its own.
 */

/*
 * Scoped through \`.markdown-body\` and qualified with the tag name: the preview's
 * github-markdown style sheet styles \`.markdown-body mark\` with its own attention
 * color, which outranks a lone class selector and would otherwise win.
 */
.markdown-body mark.mec-highlight {
  background-color: var(--mec-highlight);
  color: inherit;
  border-radius: 2px;
  padding: 0.05em 0;
  cursor: pointer;
  transition: background-color 0.12s ease-out;
}

.markdown-body mark.mec-highlight:hover,
.markdown-body mark.mec-highlight.mec-active {
  background-color: var(--mec-highlight-strong);
}

.markdown-body mark.mec-highlight.mec-resolved {
  background-color: transparent;
  box-shadow: inset 0 -1px 0 0 var(--mec-border);
}

.markdown-body mark.mec-highlight.mec-outdated {
  background-color: transparent;
  box-shadow: inset 0 -2px 0 0 var(--mec-highlight-strong);
  opacity: 0.85;
}

/*
 * The reply-count badge is drawn from an attribute rather than a child element:
 * a real element would contribute text, which would end up inside the quotes
 * captured for any comment made nearby.
 */
.markdown-body mark.mec-highlight-end::after {
  content: '\\1F4AC';
  font-size: 0.7em;
  line-height: 1;
  vertical-align: super;
  margin-left: 0.15em;
  opacity: 0.75;
  cursor: pointer;
}

.markdown-body mark.mec-highlight-end.mec-resolved::after {
  content: '\\2713';
  color: var(--mec-muted);
}

/* Panels */

.mec-panel {
  position: fixed;
  z-index: 2147483000;
  box-sizing: border-box;
  width: 320px;
  max-width: calc(100vw - 24px);
  padding: 10px;
  border: 1px solid var(--mec-border);
  border-radius: 10px;
  background-color: var(--mec-surface);
  color: var(--mec-text);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
  font: caption;
  font-size: 12px;
  line-height: 1.45;
}

.mec-panel * {
  box-sizing: border-box;
}

.mec-quote {
  margin: 0 0 8px 0;
  padding-left: 8px;
  border-left: 3px solid var(--mec-highlight-strong);
  color: var(--mec-muted);
  font-style: italic;
  max-height: 3.2em;
  overflow: hidden;
}

.mec-thread {
  max-height: 40vh;
  overflow-y: auto;
  margin: 0 0 8px 0;
}

.mec-comment + .mec-comment {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--mec-border);
}

.mec-byline {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--mec-muted);
  font-size: 11px;
  margin-bottom: 2px;
}

.mec-author {
  font-weight: 600;
  color: var(--mec-text);
}

.mec-body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.mec-flag {
  display: inline-block;
  padding: 0 5px;
  border-radius: 999px;
  border: 1px solid var(--mec-border);
  font-size: 10px;
  color: var(--mec-muted);
}

.mec-input {
  display: block;
  width: 100%;
  min-height: 62px;
  max-height: 40vh;
  resize: vertical;
  padding: 7px 8px;
  border: 1px solid var(--mec-border);
  border-radius: 7px;
  background-color: var(--mec-bg);
  color: var(--mec-text);
  font: inherit;
  font-size: 12px;
}

.mec-input:focus {
  outline: none;
  border-color: var(--mec-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mec-accent) 25%, transparent);
}

.mec-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.mec-hint {
  flex: 1;
  color: var(--mec-muted);
  font-size: 11px;
}

.mec-button {
  padding: 4px 11px;
  border: 1px solid var(--mec-border);
  border-radius: 6px;
  background-color: transparent;
  color: var(--mec-text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.mec-button:hover {
  background-color: var(--mec-highlight);
}

.mec-button.mec-primary {
  border-color: transparent;
  background-color: var(--mec-accent);
  color: var(--mec-bg);
  font-weight: 600;
}

.mec-button.mec-primary:disabled {
  opacity: 0.45;
  cursor: default;
}

.mec-button.mec-danger:hover {
  border-color: currentColor;
  color: #d1242f;
  background-color: transparent;
}
`;let M,$;function Pe(){const e=document.createElement("style");e.textContent=Re,e.setAttribute(A,""),document.head.appendChild(e)}function f(){const e=$;M?.remove(),M=void 0,$=void 0,e?.()}function O(){return M!==void 0}function F(e){const t=e instanceof Element?e:e?.parentElement??null;return t?.closest(`[${A}]`)!==null&&t!==null}function re(e,t,n){f(),e.classList.add("mec-panel"),e.setAttribute(A,""),document.body.appendChild(e),$e(e,t),M=e,$=n}function $e(e,t){const{width:o,height:r}=e.getBoundingClientRect(),i=Math.min(Math.max(8,t.left),Math.max(8,window.innerWidth-o-8)),c=t.bottom+8,s=c+r>window.innerHeight-8?Math.max(8,t.top-r-8):c;e.style.left=`${Math.round(i)}px`,e.style.top=`${Math.round(s)}px`}function d(e,t,n){const o=document.createElement(e);return t!==void 0&&(o.className=t),n!==void 0&&(o.textContent=n),o}function ie(e,t){const n=document.createElement("textarea");return n.className="mec-input",n.placeholder=e,n.rows=3,n.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey?(o.preventDefault(),o.stopPropagation(),t()):o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),f())}),n}function ce(e,t){const n=d("div","mec-actions");return n.appendChild(d("span","mec-hint",e)),t.forEach(o=>n.appendChild(o)),n}function w(e,t,n){const o=document.createElement("button");return o.className=`mec-button ${t}`,o.textContent=e,o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),n()}),o}function Oe({quote:e,near:t,onSubmit:n,onCancel:o}){const r=d("div");let i=!1;const c=()=>{const u=s.value.trim();u.length!==0&&(i=!0,f(),n(u))},s=ie("Comment on the highlighted text…",c),a=w("Comment","mec-primary",c);a.disabled=!0,s.addEventListener("input",()=>{a.disabled=s.value.trim().length===0}),r.appendChild(d("div","mec-quote",e)),r.appendChild(s),r.appendChild(ce("↵ to save",[w("Cancel","",f),a])),re(r,t,()=>{i||o()}),s.focus()}function Fe(e){const{thread:t,quote:n,outdated:o,near:r}=e,[i]=t;if(i===void 0)return;const c=d("div");c.appendChild(d("div","mec-quote",n));const s=d("div","mec-thread");for(const p of t)s.appendChild(qe(p,o&&p===i));c.appendChild(s);const a=()=>{const p=u.value.trim();p.length>0&&(f(),e.onReply(p))},u=ie("Reply…",a);c.appendChild(u),c.appendChild(ce("",[w("Delete","mec-danger",()=>{f(),e.onDelete()}),w(i.resolved===!0?"Reopen":"Resolve","",()=>{f(),e.onToggleResolved()}),w("Reply","mec-primary",a)])),re(c,r)}function qe(e,t){const n=d("div","mec-comment"),o=d("div","mec-byline");if(o.appendChild(d("span","mec-author",e.author??"unknown")),o.appendChild(d("span","",De(e.created))),e.resolved===!0&&o.appendChild(d("span","mec-flag","resolved")),t){const r=d("span","mec-flag","outdated");r.title="The text this comment quoted has changed.",o.appendChild(r)}return n.appendChild(o),n.appendChild(d("p","mec-body",e.body)),n}function De(e){if(e===void 0)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}const x={highlight:"rgba(250, 225, 125, 0.5)",highlightStrong:"rgba(250, 225, 125, 0.85)",accent:"#0550ae",text:"#24292f",background:"#ffffff",surface:"#ffffff",border:"rgba(36, 41, 47, 0.18)",muted:"rgba(36, 41, 47, 0.6)"};function j(e,t,n){const o=document.createElement("span");o.className=t,o.textContent="x",o.style.cssText="position:absolute;visibility:hidden;pointer-events:none;top:-9999px",e.appendChild(o);const r=getComputedStyle(o).getPropertyValue(n).trim();return o.remove(),Be(r)?r:void 0}function Be(e){if(e.length===0||e==="transparent")return!1;const t=L(e);return t!==void 0&&t.alpha>0}function L(e){const t=e.match(/-?[\d.]+/g);if(t===null||t.length<3)return;const[n,o,r,i]=t.map(Number);return{red:n,green:o,blue:r,alpha:i===void 0?1:i}}function q(e,t){const n=L(e);return n===void 0?e:`rgba(${n.red}, ${n.green}, ${n.blue}, ${t})`}function G(e,t){const n=L(e);return n===void 0?e:q(e,Math.min(1,n.alpha*t))}function ze(){const e=l.MarkEdit.editorView?.dom;if(e==null)return x;const t=j(e,"cm-searchMatch","background-color")??x.highlight,n=j(e,"cm-md-header","color")??x.accent,o=getComputedStyle(e).color||x.text,r=_e(e)??x.background;return{highlight:G(t,1),highlightStrong:G(t,1.8),accent:n,text:o,background:r,surface:r,border:q(o,.18),muted:q(o,.55)}}function _e(e){for(let t=e;t!==null;t=t.parentElement){const n=getComputedStyle(t).backgroundColor,o=L(n);if(o!==void 0&&o.alpha>.9)return n}}function b(){const e=ze(),t=document.documentElement.style;return t.setProperty("--mec-highlight",e.highlight),t.setProperty("--mec-highlight-strong",e.highlightStrong),t.setProperty("--mec-accent",e.accent),t.setProperty("--mec-text",e.text),t.setProperty("--mec-bg",e.background),t.setProperty("--mec-surface",e.surface),t.setProperty("--mec-border",e.border),t.setProperty("--mec-muted",e.muted),e}function We(){b(),typeof l.MarkEdit.onEditorReady=="function"&&l.MarkEdit.onEditorReady(()=>requestAnimationFrame(()=>b())),typeof l.MarkEdit.onEditorConfigChange=="function"&&l.MarkEdit.onEditorConfigChange((...t)=>{t[0]==="theme"&&requestAnimationFrame(()=>b())}),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{requestAnimationFrame(()=>b())}),new MutationObserver(()=>{T!==void 0&&clearTimeout(T),T=setTimeout(()=>{T=void 0,b()},50)}).observe(document.head,{childList:!0,subtree:!0})}let T;const se="pending";let m,C,h,S;function Ve(e){C=e,je(t=>{m=t,Ye(t),Ge(t),Ue()})}function He(){return m}function Ue(){if(W()){E();return}l.MarkEdit.onEditorReady(()=>E())}function je(e){const t=document.querySelector(".markdown-body");if(t!==null){e(t);return}const n=new MutationObserver(()=>{const o=document.querySelector(".markdown-body");o!==null&&(n.disconnect(),e(o))});n.observe(document.body,{childList:!0,subtree:!0})}function Ge(e){h=new MutationObserver(()=>D()),h.observe(e,{childList:!0,subtree:!0,characterData:!0})}function D(){S!==void 0&&cancelAnimationFrame(S),S=requestAnimationFrame(()=>{S=void 0,E()})}function E(){if(m===void 0||!W())return;b();const e=Je();h?.disconnect();try{ke(m,e)}finally{h!==void 0&&h.observe(m,{childList:!0,subtree:!0,characterData:!0})}}function Je(){const e=v();return I(e).filter(t=>C.showResolved||t.resolved!==!0).map(t=>({...t,replyCount:e.filter(n=>n.replyTo===t.id).length}))}function Ye(e){e.addEventListener("mouseup",t=>{F(t.target)||setTimeout(()=>ae(),0)}),e.addEventListener("click",t=>{const o=t.target?.closest?.(`[${g}]`),r=o?.getAttribute(g);r!=null&&r!==se&&(t.preventDefault(),t.stopPropagation(),Ze(r,o.getBoundingClientRect()))}),document.addEventListener("mousedown",t=>{O()&&!F(t.target)&&f()},!0),document.addEventListener("keydown",t=>{t.key==="Escape"&&O()&&f()})}function ae(){if(m===void 0||O())return!1;const e=Ke(m);return e===void 0||!C.openOnSelect?!1:(Xe(e),!0)}function Ke(e){const t=window.getSelection();if(t===null||t.isCollapsed||t.rangeCount===0)return;const n=t.getRangeAt(0);if(!e.contains(n.commonAncestorContainer)||F(n.commonAncestorContainer))return;const o=N(e),r=U(o,n.startContainer,n.startOffset),i=U(o,n.endContainer,n.endOffset);if(r===void 0||i===void 0)return;let c=r,s=i;for(;c<s&&/\s/.test(o.text[c]);)c+=1;for(;s>c&&/\s/.test(o.text[s-1]);)s-=1;if(s<=c)return;const a=ye(o,c,s),u=et(e,n.startContainer,n.endContainer);return{...a,start:c,end:s,line:u?.from,blockEndLine:u?.to??l.MarkEdit.editorAPI.getLineCount()-1,rect:n.getBoundingClientRect()}}function Xe(e){Qe(e.start,e.end),window.getSelection()?.removeAllRanges(),Oe({quote:e.exact,near:e.rect,onCancel:()=>E(),onSubmit:t=>{te({body:t,exact:e.exact,prefix:e.prefix,suffix:e.suffix,author:oe(C.author),created:new Date().toISOString(),line:e.line},e.blockEndLine)}})}function Qe(e,t){if(m!==void 0){h?.disconnect();try{const n=N(m);for(const o of z(n,e,t))_(o,()=>{const r=document.createElement("mark");return r.className="mec-highlight mec-active",r.setAttribute(g,se),r})}finally{h!==void 0&&m!==void 0&&h.observe(m,{childList:!0,subtree:!0,characterData:!0})}}}function Ze(e,t){const n=v(),o=ee(n,e),r=o[0];if(r===void 0)return;const c=m?.querySelector(`[${g}="${e}"]`)?.classList.contains("mec-outdated")===!0;Fe({thread:o,quote:r.exact.length>0?r.exact:"(no quoted text)",outdated:c,near:t,onReply:s=>{te({body:s,exact:"",prefix:"",suffix:"",replyTo:e,author:oe(C.author),created:new Date().toISOString()},l.MarkEdit.editorAPI.getLineNumber(r.to))},onToggleResolved:()=>{Me(e),D()},onDelete:()=>{ne(e),D()}})}function et(e,t,n){const o=[J(e,t),J(e,n)].filter(i=>i!==void 0);if(o.length===0)return;const r=o.map(tt).filter(i=>i!==void 0);if(r.length!==0)return{from:Math.min(...r.map(i=>i.from)),to:Math.max(...r.map(i=>i.to))}}function J(e,t){let n=t instanceof HTMLElement?t:t.parentElement;for(;n!==null&&n.parentElement!==e;)n=n.parentElement;return n??void 0}function tt(e){const t=[e,...e.querySelectorAll("[data-line-from]")];let n=Number.POSITIVE_INFINITY,o=Number.NEGATIVE_INFINITY;for(const r of t){const i=Y(r,"data-line-from"),c=Y(r,"data-line-to");i!==void 0&&(n=Math.min(n,i)),c!==void 0&&(o=Math.max(o,c))}return Number.isFinite(n)&&Number.isFinite(o)?{from:n,to:o}:void 0}function Y(e,t){const n=e.getAttribute(t);if(n===null)return;const o=Number(n);return Number.isFinite(o)?o:void 0}function nt(){return I(v())}const ot="extension.markeditComments";function rt(){const e=l.MarkEdit.userSettings?.[ot]??{};return{author:typeof e.author=="string"?e.author:void 0,openOnSelect:e.openOnSelect!==!1,showResolved:e.showResolved!==!1}}const it=rt();l.MarkEdit.addMainMenuItem({title:"Comments",icon:"bubble.left.and.text.bubble.right",children:[{title:"Comment on Selection",key:"M",modifiers:["Shift","Command"],action:()=>{ae()||l.MarkEdit.showAlert({title:"Nothing selected",message:"Select text in the preview, then comment on it."})}},{separator:!0},{title:"Next Comment",key:"]",modifiers:["Shift","Command"],action:()=>K(1)},{title:"Previous Comment",key:"[",modifiers:["Shift","Command"],action:()=>K(-1)},{separator:!0},{title:"Copy All Comments",action:()=>ct()},{title:"Delete Resolved Comments",state:()=>({isEnabled:le().length>0}),action:()=>{at()}},{separator:!0},{title:"Version 0.1.0",action:()=>{}}]});Pe();We();Ve(it);function le(){return I(v()).filter(e=>e.resolved===!0)}let P=-1;function K(e){const t=He(),n=nt();if(t===void 0||n.length===0)return;P=(P+e+n.length*2)%n.length;const o=t.querySelector(`[${g}="${n[P].id}"]`);o!==null&&(o.scrollIntoView({block:"center",behavior:"smooth"}),o.classList.add("mec-active"),setTimeout(()=>o.classList.remove("mec-active"),900))}function ct(){const e=v(),t=I(e);if(t.length===0){l.MarkEdit.showAlert({title:"No comments",message:"This document has no comments yet."});return}const n=new ClipboardItem({"text/plain":st(e,t).then(o=>new Blob([o],{type:"text/plain"}))});navigator.clipboard.write([n]).catch(o=>{l.MarkEdit.showAlert({title:"Could not copy comments",message:o instanceof Error?o.message:String(o)})})}async function st(e,t){const n=typeof l.MarkEdit.getFileInfo=="function"?await l.MarkEdit.getFileInfo():void 0,o=n?.filePath===void 0?"Review comments":`Review comments on ${n.filePath}`,r=t.map((i,c)=>{const s=ee(e,i.id).map(a=>`  ${a.author??"unknown"}: ${a.body.replace(/\n/g,`
  `)}`);return[`${c+1}. ${i.resolved===!0?"[resolved] ":""}on "${i.exact}"`,...s].join(`
`)});return[o,...r].join(`

`)}async function at(){const e=le();if(!(e.length===0||await l.MarkEdit.showAlert({title:`Delete ${e.length} resolved comment${e.length===1?"":"s"}?`,message:"This removes them from the document. It can be undone with Edit > Undo.",buttons:["Delete","Cancel"]})!==0)){for(const n of e)ne(n.id);E()}}
