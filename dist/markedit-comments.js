"use strict";const l=require("markedit-api"),w="<!-- annotation",E="-->",me=e=>e.replace(/-->/g,"--\\>"),fe=e=>e.replace(/--\\>/g,"-->");function R(e){return e.replace(/\s+/g," ")}function z(e){const t=[];let n=0;for(;n<e.length;){const o=e.indexOf(w,n);if(o===-1)break;if(o>0&&e[o-1]!==`
`){n=o+w.length;continue}const r=he(e,o+w.length);if(r===-1)break;const i=pe(e.slice(o+w.length,r));i!==void 0&&t.push({...i,from:o,to:r+E.length}),n=r+E.length}return t}function he(e,t){let n=t;for(;n<e.length;){const o=e.indexOf(E,n);if(o===-1)return-1;const r=e.lastIndexOf(`
`,o)+1;if(e.slice(r,o).trim()==="")return o;n=o+E.length}return-1}function pe(e){const t=e.match(/\n[ \t]*\n/),n=t===null?e:e.slice(0,t.index),o=t===null?"":e.slice((t.index??0)+t[0].length),r=ve(n),i=r.get("id");if(i===void 0)return;const c=Number(r.get("line"));return{id:i,body:fe(ge(o)).trim(),exact:r.get("exact")??"",prefix:r.get("prefix")??"",suffix:r.get("suffix")??"",author:r.get("author"),created:r.get("created"),line:Number.isFinite(c)?c:void 0,replyTo:r.get("reply-to"),resolved:r.get("resolved")==="true"}}function ge(e){return e.replace(/\n[ \t]*$/,"")}function ve(e){const t=new Map,n=/([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;for(const o of e.matchAll(n)){const[,r,i,c]=o;if(i!==void 0)try{t.set(r,JSON.parse(`"${i}"`))}catch{t.set(r,i)}else t.set(r,c)}return t}function Q(e){const t=r=>JSON.stringify(r),n=[`id=${e.id}`];e.author!==void 0&&n.push(`author=${t(e.author)}`),e.created!==void 0&&n.push(`created=${t(e.created)}`),e.line!==void 0&&n.push(`line=${e.line}`),e.replyTo!==void 0&&n.push(`reply-to=${e.replyTo}`),e.resolved===!0&&n.push("resolved=true");const o=[w,n.join(" ")];return e.replyTo===void 0&&o.push([`exact=${t(e.exact)}`,`prefix=${t(e.prefix)}`,`suffix=${t(e.suffix)}`].join(" ")),o.push("",me(e.body.trim()),E),o.join(`
`)}function be(e){const t=new Set(e);for(let n=1;;n+=1){const o=`c${n}`;if(!t.has(o))return o}}const U=48;function xe(e,t){const n=R(t.exact);if(n.length===0)return;const o=[];for(let a=e.text.indexOf(n);a!==-1;a=e.text.indexOf(n,a+1))o.push(a);if(o.length===0)return;if(o.length===1)return{start:o[0],end:o[0]+n.length,outdated:!1};const r=R(t.prefix),i=R(t.suffix);let c=o[0],s=-1;for(const a of o){const m=e.text.slice(Math.max(0,a-r.length),a),p=e.text.slice(a+n.length,a+n.length+i.length),H=we(m,r)+ye(p,i);H>s&&(c=a,s=H)}return{start:c,end:c+n.length,outdated:!1}}function ye(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[o]===t[o];)o+=1;return o}function we(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[e.length-1-o]===t[t.length-1-o];)o+=1;return o}function ke(e,t,n){return{exact:e.text.slice(t,n),prefix:e.text.slice(Math.max(0,t-U),t),suffix:e.text.slice(n,n+U)}}const M="data-mec-ui",Ee=e=>/\s/.test(e);function N(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode:i=>{const c=i.parentElement;if(c===null||c.closest(`[${M}]`)!==null)return NodeFilter.FILTER_REJECT;const s=c.tagName;return s==="SCRIPT"||s==="STYLE"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),n=[],o=[],r=[];for(let i=t.nextNode();i!==null;i=t.nextNode()){const c=i,s=c.data;for(let a=0;a<s.length;a+=1){const m=s[a];if(Ee(m)){if(n.length===0||n[n.length-1]===" ")continue;n.push(" ")}else n.push(m);o.push(c),r.push(a)}}return{text:n.join(""),nodes:o,offsets:r}}function _(e,t,n){const o=[];for(let r=t;r<n;r+=1){const i=e.nodes[r],c=e.offsets[r];if(i===void 0)break;const s=o[o.length-1];s!==void 0&&s.node===i?s.to=c+1:o.push({node:i,from:c,to:c+1})}return o}function j(e,t,n){if(t.nodeType!==Node.TEXT_NODE){const r=e.nodes.findIndex(i=>t.contains(i));return r===-1?void 0:r}let o;for(let r=0;r<e.nodes.length;r+=1)if(e.nodes[r]===t){if(e.offsets[r]>=n)return r;o=r+1}return o}function W(e,t){const n=document.createRange();n.setStart(e.node,e.from),n.setEnd(e.node,Math.min(e.to,e.node.data.length));const o=t();return n.surroundContents(o),o}const g="data-mec-id";function Ce(e,t){Te(e);for(const n of t){const o=N(e),r=xe(o,n);if(r===void 0){Se(e,n);continue}const c=_(o,r.start,r.end).map(s=>W(s,()=>Z(n,!1)));ee(c,n)}}function Te(e){const t=e.querySelectorAll(`[${g}]`);if(t.length!==0){for(const n of t){const o=n.parentNode;if(o!==null){for(;n.firstChild!==null;)o.insertBefore(n.firstChild,n);n.remove()}}e.normalize()}}function Z(e,t){const n=document.createElement("mark");return n.className="mec-highlight",n.setAttribute(g,e.id),n.setAttribute("role","button"),n.tabIndex=0,e.resolved===!0&&n.classList.add("mec-resolved"),t&&(n.classList.add("mec-outdated"),n.title="The text this comment was written against has changed."),n}function ee(e,t){const n=e[e.length-1];n!==void 0&&(n.classList.add("mec-highlight-end"),n.setAttribute("data-mec-count",String(t.replyCount??0)))}function Se(e,t){const n=Ae(e,t.line);if(n===void 0)return;const o=N(n);if(o.text.trim().length===0)return;const i=_(o,0,o.text.length).map(c=>W(c,()=>Z(t,!0)));ee(i,t)}function Ae(e,t){if(t===void 0)return;let n,o=Number.POSITIVE_INFINITY;for(const r of e.querySelectorAll("[data-line-from]")){const i=Number(r.getAttribute("data-line-from")),c=r.getAttribute("data-line-to"),s=c===null?i:Number(c);if(!Number.isFinite(i)||!Number.isFinite(s))continue;const a=t>=i&&t<=s?0:Math.min(Math.abs(t-i),Math.abs(t-s));a<o&&(n=r,o=a)}return n}function v(){return V()?z(l.MarkEdit.editorAPI.getText()):[]}function V(){return l.MarkEdit.editorView?.state!==void 0}function te(e,t){const n=e.find(o=>o.id===t);return n===void 0?[]:[n,...e.filter(o=>o.replyTo===t)]}function I(e){return e.filter(t=>t.replyTo===void 0)}function ne(e,t){const n=l.MarkEdit.editorAPI,o=n.getText(),r=z(o),i={...e,id:be(r.map(a=>a.id))},c=Pe(o,r,Ie(o,Re(t))),s=`

${Q(i)}${Le(o,c)}`;return n.setText(s,{from:c,to:c}),i.id}function Me(e,t){const o=v().find(s=>s.id===e);if(o===void 0)return;const{from:r,to:i,...c}=o;l.MarkEdit.editorAPI.setText(Q({...c,...t}),{from:r,to:i})}function oe(e){const t=l.MarkEdit.editorAPI,n=t.getText(),i=[...z(n).filter(c=>c.id===e||c.replyTo===e)].sort((c,s)=>s.from-c.from);for(const c of i){const s=n.startsWith(`

`,c.from-2)?c.from-2:c.from;t.setText("",{from:s,to:c.to})}}function Ne(e){const t=v().find(n=>n.id===e);t!==void 0&&Me(e,{resolved:t.resolved!==!0})}function Ie(e,t){let n=t;for(;n>0;){const o=e.lastIndexOf(`
`,n-1)+1;if(e.slice(o,n).trim()!=="")return n;n=o===0?0:o-1}return n}function Le(e,t){const n=e.slice(t);return n.trim().length===0||n.startsWith(`

`)?"":n.startsWith(`
`)?`
`:`

`}function Re(e){const t=l.MarkEdit.editorAPI,n=Math.max(0,Math.min(e,t.getLineCount()-1));return t.getLineRange(n).to}function Pe(e,t,n){let o=n;for(;;){const r=t.find(i=>i.from>=o&&e.slice(o,i.from).trim()==="");if(r===void 0)return o;o=r.to}}function re(e){if(typeof e=="string"&&e.length>0)return e;try{return l.MarkEdit.getDirectoryPath("home").match(/^\/Users\/([^/]+)/)?.[1]??"me"}catch{return"me"}}const $e=`/*
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
`;let A,O;function Oe(){const e=document.createElement("style");e.textContent=$e,e.setAttribute(M,""),document.head.appendChild(e)}function f(){const e=O;A?.remove(),A=void 0,O=void 0,e?.()}function F(){return A!==void 0}function q(e){const t=e instanceof Element?e:e?.parentElement??null;return t?.closest(`[${M}]`)!==null&&t!==null}function ie(e,t,n){f(),e.classList.add("mec-panel"),e.setAttribute(M,""),document.body.appendChild(e),Fe(e,t),A=e,O=n}function Fe(e,t){const{width:o,height:r}=e.getBoundingClientRect(),i=Math.min(Math.max(8,t.left),Math.max(8,window.innerWidth-o-8)),c=t.bottom+8,s=c+r>window.innerHeight-8?Math.max(8,t.top-r-8):c;e.style.left=`${Math.round(i)}px`,e.style.top=`${Math.round(s)}px`}function u(e,t,n){const o=document.createElement(e);return t!==void 0&&(o.className=t),n!==void 0&&(o.textContent=n),o}function ce(e,t){const n=document.createElement("textarea");return n.className="mec-input",n.placeholder=e,n.rows=3,n.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey?(o.preventDefault(),o.stopPropagation(),t()):o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),f())}),n}function se(e,t){const n=u("div","mec-actions");return n.appendChild(u("span","mec-hint",e)),t.forEach(o=>n.appendChild(o)),n}function k(e,t,n){const o=document.createElement("button");return o.className=`mec-button ${t}`,o.textContent=e,o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),n()}),o}function qe({quote:e,near:t,onSubmit:n,onCancel:o}){const r=u("div");let i=!1;const c=()=>{const m=s.value.trim();m.length!==0&&(i=!0,f(),n(m))},s=ce("Comment on the highlighted text…",c),a=k("Comment","mec-primary",c);a.disabled=!0,s.addEventListener("input",()=>{a.disabled=s.value.trim().length===0}),r.appendChild(u("div","mec-quote",e)),r.appendChild(s),r.appendChild(se("↵ to save",[k("Cancel","",f),a])),ie(r,t,()=>{i||o()}),s.focus()}function De(e){const{thread:t,quote:n,outdated:o,near:r}=e,[i]=t;if(i===void 0)return;const c=u("div");c.appendChild(u("div","mec-quote",n));const s=u("div","mec-thread");for(const p of t)s.appendChild(Be(p,o&&p===i));c.appendChild(s);const a=()=>{const p=m.value.trim();p.length>0&&(f(),e.onReply(p))},m=ce("Reply…",a);c.appendChild(m),c.appendChild(se("",[k("Delete","mec-danger",()=>{f(),e.onDelete()}),k(i.resolved===!0?"Reopen":"Resolve","",()=>{f(),e.onToggleResolved()}),k("Reply","mec-primary",a)])),ie(c,r)}function Be(e,t){const n=u("div","mec-comment"),o=u("div","mec-byline");if(o.appendChild(u("span","mec-author",e.author??"unknown")),o.appendChild(u("span","",ze(e.created))),e.resolved===!0&&o.appendChild(u("span","mec-flag","resolved")),t){const r=u("span","mec-flag","outdated");r.title="The text this comment quoted has changed.",o.appendChild(r)}return n.appendChild(o),n.appendChild(u("p","mec-body",e.body)),n}function ze(e){if(e===void 0)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}const y={highlight:"rgba(250, 225, 125, 0.5)",highlightStrong:"rgba(250, 225, 125, 0.85)",accent:"#0550ae",text:"#24292f",background:"#ffffff",surface:"#ffffff",border:"rgba(36, 41, 47, 0.18)",muted:"rgba(36, 41, 47, 0.6)"};function G(e,t,n){const o=document.createElement("span");o.className=t,o.textContent="x",o.style.cssText="position:absolute;visibility:hidden;pointer-events:none;top:-9999px",e.appendChild(o);const r=getComputedStyle(o).getPropertyValue(n).trim();return o.remove(),_e(r)?r:void 0}function _e(e){if(e.length===0||e==="transparent")return!1;const t=L(e);return t!==void 0&&t.alpha>0}function L(e){const t=e.match(/-?[\d.]+/g);if(t===null||t.length<3)return;const[n,o,r,i]=t.map(Number);return{red:n,green:o,blue:r,alpha:i===void 0?1:i}}function D(e,t){const n=L(e);return n===void 0?e:`rgba(${n.red}, ${n.green}, ${n.blue}, ${t})`}function J(e,t){const n=L(e);return n===void 0?e:D(e,Math.min(1,n.alpha*t))}function We(){const e=l.MarkEdit.editorView?.dom;if(e==null)return y;const t=G(e,"cm-searchMatch","background-color")??y.highlight,n=G(e,"cm-md-header","color")??y.accent,o=getComputedStyle(e).color||y.text,r=Ve(e)??y.background;return{highlight:J(t,1),highlightStrong:J(t,1.8),accent:n,text:o,background:r,surface:r,border:D(o,.18),muted:D(o,.55)}}function Ve(e){for(let t=e;t!==null;t=t.parentElement){const n=getComputedStyle(t).backgroundColor,o=L(n);if(o!==void 0&&o.alpha>.9)return n}}function b(){const e=We(),t=document.documentElement.style;return t.setProperty("--mec-highlight",e.highlight),t.setProperty("--mec-highlight-strong",e.highlightStrong),t.setProperty("--mec-accent",e.accent),t.setProperty("--mec-text",e.text),t.setProperty("--mec-bg",e.background),t.setProperty("--mec-surface",e.surface),t.setProperty("--mec-border",e.border),t.setProperty("--mec-muted",e.muted),e}function He(){b(),typeof l.MarkEdit.onEditorReady=="function"&&l.MarkEdit.onEditorReady(()=>requestAnimationFrame(()=>b())),typeof l.MarkEdit.onEditorConfigChange=="function"&&l.MarkEdit.onEditorConfigChange((...t)=>{t[0]==="theme"&&requestAnimationFrame(()=>b())}),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{requestAnimationFrame(()=>b())}),new MutationObserver(()=>{T!==void 0&&clearTimeout(T),T=setTimeout(()=>{T=void 0,b()},50)}).observe(document.head,{childList:!0,subtree:!0})}let T;const ae="pending";let d,C,h,S;function Ue(e){C=e,Je(t=>{d=t,Qe(t),Ye(t),Ge()})}function je(){return d}function Ge(){if(V()){x();return}l.MarkEdit.onEditorReady(()=>x())}function Je(e){const t=document.querySelector(".markdown-body");if(t!==null){e(t);return}const n=new MutationObserver(()=>{const o=document.querySelector(".markdown-body");o!==null&&(n.disconnect(),e(o))});n.observe(document.body,{childList:!0,subtree:!0})}function Ye(e){h=new MutationObserver(()=>B()),h.observe(e,{childList:!0,subtree:!0,characterData:!0})}function B(){S!==void 0&&cancelAnimationFrame(S),S=requestAnimationFrame(()=>{S=void 0,x()})}function x(){if(d===void 0||!V())return;if(le(d)){Ke();return}b();const e=Xe();h?.disconnect();try{Ce(d,e)}finally{h!==void 0&&h.observe(d,{childList:!0,subtree:!0,characterData:!0})}}function le(e){const t=window.getSelection();return t===null||t.isCollapsed||t.rangeCount===0?!1:e.contains(t.getRangeAt(0).commonAncestorContainer)}function Ke(){if(P)return;P=!0;const e=()=>{d!==void 0&&le(d)||(document.removeEventListener("selectionchange",e),P=!1,x())};document.addEventListener("selectionchange",e)}let P=!1;function Xe(){const e=v();return I(e).filter(t=>C.showResolved||t.resolved!==!0).map(t=>({...t,replyCount:e.filter(n=>n.replyTo===t.id).length}))}function Qe(e){e.addEventListener("mouseup",t=>{q(t.target)||setTimeout(()=>de(),0)}),e.addEventListener("click",t=>{const o=t.target?.closest?.(`[${g}]`),r=o?.getAttribute(g);r!=null&&r!==ae&&(t.preventDefault(),t.stopPropagation(),nt(r,o.getBoundingClientRect()))}),document.addEventListener("mousedown",t=>{F()&&!q(t.target)&&f()},!0),document.addEventListener("keydown",t=>{t.key==="Escape"&&F()&&f()})}function de(){if(d===void 0||F())return!1;const e=Ze(d);return e===void 0||!C.openOnSelect?!1:(et(e),!0)}function Ze(e){const t=window.getSelection();if(t===null||t.isCollapsed||t.rangeCount===0)return;const n=t.getRangeAt(0);if(!e.contains(n.commonAncestorContainer)||q(n.commonAncestorContainer))return;const o=N(e),r=j(o,n.startContainer,n.startOffset),i=j(o,n.endContainer,n.endOffset);if(r===void 0||i===void 0)return;let c=r,s=i;for(;c<s&&/\s/.test(o.text[c]);)c+=1;for(;s>c&&/\s/.test(o.text[s-1]);)s-=1;if(s<=c)return;const a=ke(o,c,s),m=ot(e,n.startContainer,n.endContainer);return{...a,start:c,end:s,line:m?.from,blockEndLine:m?.to??l.MarkEdit.editorAPI.getLineCount()-1,rect:n.getBoundingClientRect()}}function et(e){window.getSelection()?.removeAllRanges(),tt(e.start,e.end),qe({quote:e.exact,near:e.rect,onCancel:()=>x(),onSubmit:t=>{ne({body:t,exact:e.exact,prefix:e.prefix,suffix:e.suffix,author:re(C.author),created:new Date().toISOString(),line:e.line},e.blockEndLine)}})}function tt(e,t){if(d!==void 0){h?.disconnect();try{const n=N(d);for(const o of _(n,e,t))W(o,()=>{const r=document.createElement("mark");return r.className="mec-highlight mec-active",r.setAttribute(g,ae),r})}finally{h!==void 0&&d!==void 0&&h.observe(d,{childList:!0,subtree:!0,characterData:!0})}}}function nt(e,t){const n=v(),o=te(n,e),r=o[0];if(r===void 0)return;const c=d?.querySelector(`[${g}="${e}"]`)?.classList.contains("mec-outdated")===!0;De({thread:o,quote:r.exact.length>0?r.exact:"(no quoted text)",outdated:c,near:t,onReply:s=>{ne({body:s,exact:"",prefix:"",suffix:"",replyTo:e,author:re(C.author),created:new Date().toISOString()},l.MarkEdit.editorAPI.getLineNumber(r.to))},onToggleResolved:()=>{Ne(e),B()},onDelete:()=>{oe(e),B()}})}function ot(e,t,n){const o=[Y(e,t),Y(e,n)].filter(i=>i!==void 0);if(o.length===0)return;const r=o.map(rt).filter(i=>i!==void 0);if(r.length!==0)return{from:Math.min(...r.map(i=>i.from)),to:Math.max(...r.map(i=>i.to))}}function Y(e,t){let n=t instanceof HTMLElement?t:t.parentElement;for(;n!==null&&n.parentElement!==e;)n=n.parentElement;return n??void 0}function rt(e){const t=[e,...e.querySelectorAll("[data-line-from]")];let n=Number.POSITIVE_INFINITY,o=Number.NEGATIVE_INFINITY;for(const r of t){const i=K(r,"data-line-from"),c=K(r,"data-line-to");i!==void 0&&(n=Math.min(n,i)),c!==void 0&&(o=Math.max(o,c))}return Number.isFinite(n)&&Number.isFinite(o)?{from:n,to:o}:void 0}function K(e,t){const n=e.getAttribute(t);if(n===null)return;const o=Number(n);return Number.isFinite(o)?o:void 0}function it(){return I(v())}const ct="extension.markeditComments";function st(){const e=l.MarkEdit.userSettings?.[ct]??{};return{author:typeof e.author=="string"?e.author:void 0,openOnSelect:e.openOnSelect!==!1,showResolved:e.showResolved!==!1}}const at=st();l.MarkEdit.addMainMenuItem({title:"Comments",icon:"bubble.left.and.text.bubble.right",children:[{title:"Comment on Selection",key:"M",modifiers:["Shift","Command"],action:()=>{de()||l.MarkEdit.showAlert({title:"Nothing selected",message:"Select text in the preview, then comment on it."})}},{separator:!0},{title:"Next Comment",key:"]",modifiers:["Shift","Command"],action:()=>X(1)},{title:"Previous Comment",key:"[",modifiers:["Shift","Command"],action:()=>X(-1)},{separator:!0},{title:"Copy All Comments",action:()=>lt()},{title:"Delete Resolved Comments",state:()=>({isEnabled:ue().length>0}),action:()=>{ut()}},{separator:!0},{title:"Version 0.1.1",action:()=>{}}]});Oe();He();Ue(at);function ue(){return I(v()).filter(e=>e.resolved===!0)}let $=-1;function X(e){const t=je(),n=it();if(t===void 0||n.length===0)return;$=($+e+n.length*2)%n.length;const o=t.querySelector(`[${g}="${n[$].id}"]`);o!==null&&(o.scrollIntoView({block:"center",behavior:"smooth"}),o.classList.add("mec-active"),setTimeout(()=>o.classList.remove("mec-active"),900))}function lt(){const e=v(),t=I(e);if(t.length===0){l.MarkEdit.showAlert({title:"No comments",message:"This document has no comments yet."});return}const n=new ClipboardItem({"text/plain":dt(e,t).then(o=>new Blob([o],{type:"text/plain"}))});navigator.clipboard.write([n]).catch(o=>{l.MarkEdit.showAlert({title:"Could not copy comments",message:o instanceof Error?o.message:String(o)})})}async function dt(e,t){const n=typeof l.MarkEdit.getFileInfo=="function"?await l.MarkEdit.getFileInfo():void 0,o=n?.filePath===void 0?"Review comments":`Review comments on ${n.filePath}`,r=t.map((i,c)=>{const s=te(e,i.id).map(a=>`  ${a.author??"unknown"}: ${a.body.replace(/\n/g,`
  `)}`);return[`${c+1}. ${i.resolved===!0?"[resolved] ":""}on "${i.exact}"`,...s].join(`
`)});return[o,...r].join(`

`)}async function ut(){const e=ue();if(!(e.length===0||await l.MarkEdit.showAlert({title:`Delete ${e.length} resolved comment${e.length===1?"":"s"}?`,message:"This removes them from the document. It can be undone with Edit > Undo.",buttons:["Delete","Cancel"]})!==0)){for(const n of e)oe(n.id);x()}}
