"use strict";const s=require("markedit-api"),x="<!-- annotation",E="-->",ue=e=>e.replace(/-->/g,"--\\>"),me=e=>e.replace(/--\\>/g,"-->");function L(e){return e.replace(/\s+/g," ")}function q(e){const t=[];let n=0;for(;n<e.length;){const o=e.indexOf(x,n);if(o===-1)break;if(o>0&&e[o-1]!==`
`){n=o+x.length;continue}const r=fe(e,o+x.length);if(r===-1)break;const i=he(e.slice(o+x.length,r));i!==void 0&&t.push({...i,from:o,to:r+E.length}),n=r+E.length}return t}function fe(e,t){let n=t;for(;n<e.length;){const o=e.indexOf(E,n);if(o===-1)return-1;const r=e.lastIndexOf(`
`,o)+1;if(e.slice(r,o).trim()==="")return o;n=o+E.length}return-1}function he(e){const t=e.match(/\n[ \t]*\n/),n=t===null?e:e.slice(0,t.index),o=t===null?"":e.slice((t.index??0)+t[0].length),r=ge(n),i=r.get("id");if(i===void 0)return;const c=Number(r.get("line"));return{id:i,body:me(pe(o)).trim(),exact:r.get("exact")??"",prefix:r.get("prefix")??"",suffix:r.get("suffix")??"",author:r.get("author"),created:r.get("created"),line:Number.isFinite(c)?c:void 0,replyTo:r.get("reply-to"),resolved:r.get("resolved")==="true"}}function pe(e){return e.replace(/\n[ \t]*$/,"")}function ge(e){const t=new Map,n=/([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;for(const o of e.matchAll(n)){const[,r,i,c]=o;if(i!==void 0)try{t.set(r,JSON.parse(`"${i}"`))}catch{t.set(r,i)}else t.set(r,c)}return t}function Q(e){const t=r=>JSON.stringify(r),n=[`id=${e.id}`];e.author!==void 0&&n.push(`author=${t(e.author)}`),e.created!==void 0&&n.push(`created=${t(e.created)}`),e.line!==void 0&&n.push(`line=${e.line}`),e.replyTo!==void 0&&n.push(`reply-to=${e.replyTo}`),e.resolved===!0&&n.push("resolved=true");const o=[x,n.join(" ")];return e.replyTo===void 0&&o.push([`exact=${t(e.exact)}`,`prefix=${t(e.prefix)}`,`suffix=${t(e.suffix)}`].join(" ")),o.push("",ue(e.body.trim()),E),o.join(`
`)}function be(e){const t=new Set(e);for(let n=1;;n+=1){const o=`c${n}`;if(!t.has(o))return o}}const z=48;function ve(e,t){const n=L(t.exact);if(n.length===0)return;const o=[];for(let a=e.text.indexOf(n);a!==-1;a=e.text.indexOf(n,a+1))o.push(a);if(o.length===0)return;if(o.length===1)return{start:o[0],end:o[0]+n.length,outdated:!1};const r=L(t.prefix),i=L(t.suffix);let c=o[0],d=-1;for(const a of o){const u=e.text.slice(Math.max(0,a-r.length),a),m=e.text.slice(a+n.length,a+n.length+i.length),W=ye(u,r)+xe(m,i);W>d&&(c=a,d=W)}return{start:c,end:c+n.length,outdated:!1}}function xe(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[o]===t[o];)o+=1;return o}function ye(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[e.length-1-o]===t[t.length-1-o];)o+=1;return o}function we(e,t,n){return{exact:e.text.slice(t,n),prefix:e.text.slice(Math.max(0,t-z),t),suffix:e.text.slice(n,n+z)}}const N="data-mec-ui",Ee=e=>/\s/.test(e);function Z(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode:i=>{const c=i.parentElement;if(c===null||c.closest(`[${N}]`)!==null)return NodeFilter.FILTER_REJECT;const d=c.tagName;return d==="SCRIPT"||d==="STYLE"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),n=[],o=[],r=[];for(let i=t.nextNode();i!==null;i=t.nextNode()){const c=i,d=c.data;for(let a=0;a<d.length;a+=1){const u=d[a];if(Ee(u)){if(n.length===0||n[n.length-1]===" ")continue;n.push(" ")}else n.push(u);o.push(c),r.push(a)}}return{text:n.join(""),nodes:o,offsets:r}}function _(e,t,n){if(t.nodeType!==Node.TEXT_NODE){const r=e.nodes.findIndex(i=>t.contains(i));return r===-1?void 0:r}let o;for(let r=0;r<e.nodes.length;r+=1)if(e.nodes[r]===t){if(e.offsets[r]>=n)return r;o=r+1}return o}function ee(e,t,n){const o=e.nodes[t],r=e.nodes[n-1];if(o===void 0||r===void 0)return;const i=document.createRange();return i.setStart(o,e.offsets[t]),i.setEnd(r,Math.min(e.offsets[n-1]+1,r.data.length)),i}const g={comment:"mec-comment",resolved:"mec-comment-resolved",outdated:"mec-comment-outdated",pending:"mec-comment-pending",active:"mec-comment-active"};let C=[];function Ce(){return typeof CSS<"u"&&"highlights"in CSS&&typeof Highlight=="function"}function ke(e,t){const n=Z(e),o={comment:[],resolved:[],outdated:[]};C=[];for(const r of t){const i=Te(e,n,r);if(i===void 0)continue;const{range:c,outdated:d}=i;C.push({id:r.id,range:c,outdated:d,replyCount:r.replyCount??0});const a=d?"outdated":r.resolved===!0?"resolved":"comment";o[a].push(c)}y(g.comment,o.comment),y(g.resolved,o.resolved),y(g.outdated,o.outdated)}function Te(e,t,n){const o=ve(t,n);if(o!==void 0){const c=ee(t,o.start,o.end);return c===void 0?void 0:{range:c,outdated:!1}}const r=Me(e,n.line);if(r===void 0||r.textContent===null||r.textContent.trim().length===0)return;const i=document.createRange();return i.selectNodeContents(r),{range:i,outdated:!0}}function y(e,t){if(Ce()){if(t.length===0){CSS.highlights.delete(e);return}CSS.highlights.set(e,new Highlight(...t))}}function Se(e){y(g.pending,[e])}function Ae(){CSS.highlights.delete(g.pending)}function U(e){const t=C.find(n=>n.id===e);y(g.active,t===void 0?[]:[t.range])}function Y(e,t){const n=document.caretRangeFromPoint?.(e,t);if(n!=null)for(const o of C)try{if(o.range.comparePoint(n.startContainer,n.startOffset)===0)return{id:o.id,outdated:o.outdated}}catch{}}function te(e){const t=C.find(o=>o.id===e);if(t===void 0)return;const n=t.range.getBoundingClientRect();return n.width===0&&n.height===0?void 0:n}function Me(e,t){if(t===void 0)return;let n,o=Number.POSITIVE_INFINITY;for(const r of e.querySelectorAll("[data-line-from]")){const i=Number(r.getAttribute("data-line-from")),c=r.getAttribute("data-line-to"),d=c===null?i:Number(c);if(!Number.isFinite(i)||!Number.isFinite(d))continue;const a=t>=i&&t<=d?0:Math.min(Math.abs(t-i),Math.abs(t-d));a<o&&(n=r,o=a)}return n}function h(){return H()?q(s.MarkEdit.editorAPI.getText()):[]}function H(){return s.MarkEdit.editorView?.state!==void 0}function ne(e,t){const n=e.find(o=>o.id===t);return n===void 0?[]:[n,...e.filter(o=>o.replyTo===t)]}function R(e){return e.filter(t=>t.replyTo===void 0)}function oe(e,t){const n=s.MarkEdit.editorAPI,o=n.getText(),r=q(o),i={...e,id:be(r.map(a=>a.id))},c=Oe(o,r,Ie(o,Pe(t))),d=`

${Q(i)}${Le(o,c)}`;return n.setText(d,{from:c,to:c}),i.id}function Ne(e,t){const o=h().find(d=>d.id===e);if(o===void 0)return;const{from:r,to:i,...c}=o;s.MarkEdit.editorAPI.setText(Q({...c,...t}),{from:r,to:i})}function re(e){const t=s.MarkEdit.editorAPI,n=t.getText(),i=[...q(n).filter(c=>c.id===e||c.replyTo===e)].sort((c,d)=>d.from-c.from);for(const c of i){const d=n.startsWith(`

`,c.from-2)?c.from-2:c.from;t.setText("",{from:d,to:c.to})}}function Re(e){const t=h().find(n=>n.id===e);t!==void 0&&Ne(e,{resolved:t.resolved!==!0})}function Ie(e,t){let n=t;for(;n>0;){const o=e.lastIndexOf(`
`,n-1)+1;if(e.slice(o,n).trim()!=="")return n;n=o===0?0:o-1}return n}function Le(e,t){const n=e.slice(t);return n.trim().length===0||n.startsWith(`

`)?"":n.startsWith(`
`)?`
`:`

`}function Pe(e){const t=s.MarkEdit.editorAPI,n=Math.max(0,Math.min(e,t.getLineCount()-1));return t.getLineRange(n).to}function Oe(e,t,n){let o=n;for(;;){const r=t.find(i=>i.from>=o&&e.slice(o,i.from).trim()==="");if(r===void 0)return o;o=r.to}}function ie(e){if(typeof e=="string"&&e.length>0)return e;try{return s.MarkEdit.getDirectoryPath("home").match(/^\/Users\/([^/]+)/)?.[1]??"me"}catch{return"me"}}const Fe=new Set(["P","BR","HR","SPAN","DIV","STRONG","B","EM","I","DEL","S","MARK","SUP","SUB","CODE","PRE","KBD","SAMP","A","UL","OL","LI","BLOCKQUOTE","H1","H2","H3","H4","H5","H6","TABLE","THEAD","TBODY","TR","TH","TD","IMG","INPUT"]),$e=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","FORM","LINK","META","BASE","NOSCRIPT"]),De=new Set(["href","src","alt","title","type","checked","disabled","colspan","rowspan"]);function Be(e){const t=e.trim().toLowerCase();return t.startsWith("#")||t.startsWith("/")||t.startsWith("./")||t.startsWith("../")?!0:/^(https?|mailto):/.test(t)}function qe(e){for(const t of[...e.querySelectorAll("*")]){if($e.has(t.tagName)){t.remove();continue}if(!Fe.has(t.tagName)){t.replaceWith(...t.childNodes);continue}for(const n of[...t.attributes]){const o=n.name.toLowerCase();De.has(o)&&!o.startsWith("on")&&(o!=="href"&&o!=="src"||Be(n.value))||t.removeAttribute(n.name)}t.tagName==="A"&&(t.setAttribute("target","_blank"),t.setAttribute("rel","noopener noreferrer")),t.tagName==="INPUT"&&t.setAttribute("disabled","")}}async function He(e,t){e.textContent=t;const n=window.MarkEditRenderHtml;if(typeof n=="function")try{const o=await n(t,!1),r=document.createElement("template");if(r.innerHTML=o.replace(/^\s*<meta charset="UTF-8">\s*/i,""),qe(r.content),r.content.textContent?.trim().length===0)return;e.textContent="",e.appendChild(r.content),e.classList.add("mec-rendered")}catch{}}const We=`/*
 * All colors come from custom properties that \`theme.ts\` fills in by measuring
 * the editor theme, so the comment UI follows whatever theme the user has set
 * (and follows it again when they change it) rather than hard-coding its own.
 */

/*
 * Highlights are painted with the CSS Custom Highlight API rather than by
 * wrapping text in elements, so the document is never modified. Only a few
 * properties are honoured on ::highlight() — colour, background, text
 * decoration and shadow — which is why the resolved and outdated states are
 * distinguished by underline rather than by a border or padding.
 */

::highlight(mec-comment) {
  background-color: var(--mec-highlight);
}

::highlight(mec-comment-pending),
::highlight(mec-comment-active) {
  background-color: var(--mec-highlight-strong);
}

::highlight(mec-comment-resolved) {
  background-color: transparent;
  text-decoration: underline;
  text-decoration-color: var(--mec-border);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

::highlight(mec-comment-outdated) {
  background-color: transparent;
  text-decoration: underline wavy;
  text-decoration-color: var(--mec-highlight-strong);
  text-underline-offset: 2px;
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

/*
 * Once the body is rendered Markdown it is a document fragment, not a line of
 * text: block spacing, heading sizes and code blocks all have to be pulled back
 * to comment scale so a pasted heading or fence cannot dominate the panel.
 */
.mec-body.mec-rendered {
  white-space: normal;
}

.mec-body.mec-rendered > *:first-child { margin-top: 0; }
.mec-body.mec-rendered > *:last-child { margin-bottom: 0; }

.mec-body.mec-rendered p,
.mec-body.mec-rendered ul,
.mec-body.mec-rendered ol,
.mec-body.mec-rendered blockquote,
.mec-body.mec-rendered pre,
.mec-body.mec-rendered table {
  margin: 0.4em 0;
}

.mec-body.mec-rendered h1,
.mec-body.mec-rendered h2,
.mec-body.mec-rendered h3,
.mec-body.mec-rendered h4,
.mec-body.mec-rendered h5,
.mec-body.mec-rendered h6 {
  margin: 0.5em 0 0.3em;
  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;
  border: none;
}

.mec-body.mec-rendered ul,
.mec-body.mec-rendered ol {
  padding-left: 1.3em;
}

.mec-body.mec-rendered li { margin: 0.15em 0; }

.mec-body.mec-rendered code {
  padding: 0.1em 0.3em;
  border-radius: 4px;
  background-color: var(--mec-highlight);
  font-family: ui-monospace, monospace;
  font-size: 0.92em;
}

.mec-body.mec-rendered pre {
  padding: 6px 8px;
  border-radius: 6px;
  background-color: var(--mec-highlight);
  overflow-x: auto;
}

.mec-body.mec-rendered pre code {
  padding: 0;
  background: none;
  white-space: pre;
}

.mec-body.mec-rendered blockquote {
  padding-left: 8px;
  border-left: 3px solid var(--mec-border);
  color: var(--mec-muted);
}

.mec-body.mec-rendered a {
  color: var(--mec-accent);
}

.mec-body.mec-rendered img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.mec-body.mec-rendered table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.95em;
}

.mec-body.mec-rendered th,
.mec-body.mec-rendered td {
  padding: 2px 6px;
  border: 1px solid var(--mec-border);
}

.mec-body.mec-rendered hr {
  margin: 0.5em 0;
  border: none;
  border-top: 1px solid var(--mec-border);
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
`;let M,O;function ze(){const e=document.createElement("style");e.textContent=We,e.setAttribute(N,""),document.head.appendChild(e)}function f(){const e=O;M?.remove(),M=void 0,O=void 0,e?.()}function F(){return M!==void 0}function $(e){const t=e instanceof Element?e:e?.parentElement??null;return t?.closest(`[${N}]`)!==null&&t!==null}function ce(e,t,n){f(),e.classList.add("mec-panel"),e.setAttribute(N,""),document.body.appendChild(e),_e(e,t),M=e,O=n}function _e(e,t){const{width:o,height:r}=e.getBoundingClientRect(),i=Math.min(Math.max(8,t.left),Math.max(8,window.innerWidth-o-8)),c=t.bottom+8,d=c+r>window.innerHeight-8?Math.max(8,t.top-r-8):c;e.style.left=`${Math.round(i)}px`,e.style.top=`${Math.round(d)}px`}function l(e,t,n){const o=document.createElement(e);return t!==void 0&&(o.className=t),n!==void 0&&(o.textContent=n),o}function de(e,t){const n=document.createElement("textarea");return n.className="mec-input",n.placeholder=e,n.rows=3,n.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey?(o.preventDefault(),o.stopPropagation(),t()):o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),f())}),n}function ae(e,t){const n=l("div","mec-actions");return n.appendChild(l("span","mec-hint",e)),t.forEach(o=>n.appendChild(o)),n}function w(e,t,n){const o=document.createElement("button");return o.className=`mec-button ${t}`,o.textContent=e,o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),n()}),o}function Ue({quote:e,near:t,onSubmit:n,onCancel:o}){const r=l("div");let i=!1;const c=()=>{const u=d.value.trim();u.length!==0&&(i=!0,f(),n(u))},d=de("Comment on the highlighted text…",c),a=w("Comment","mec-primary",c);a.disabled=!0,d.addEventListener("input",()=>{a.disabled=d.value.trim().length===0}),r.appendChild(l("div","mec-quote",e)),r.appendChild(d),r.appendChild(ae("↵ to save",[w("Cancel","",f),a])),ce(r,t,()=>{i||o()}),d.focus()}function Ye(e){const{thread:t,quote:n,outdated:o,near:r}=e,[i]=t;if(i===void 0)return;const c=l("div");c.appendChild(l("div","mec-quote",n));const d=l("div","mec-thread");for(const m of t)d.appendChild(Ve(m,o&&m===i));c.appendChild(d);const a=()=>{const m=u.value.trim();m.length>0&&(f(),e.onReply(m))},u=de("Reply…",a);c.appendChild(u),c.appendChild(ae("",[w("Delete","mec-danger",()=>{f(),e.onDelete()}),w(i.resolved===!0?"Reopen":"Resolve","",()=>{f(),e.onToggleResolved()}),w("Reply","mec-primary",a)])),ce(c,r)}function Ve(e,t){const n=l("div","mec-comment"),o=l("div","mec-byline");if(o.appendChild(l("span","mec-author",e.author??"unknown")),o.appendChild(l("span","",Ge(e.created))),e.resolved===!0&&o.appendChild(l("span","mec-flag","resolved")),t){const i=l("span","mec-flag","outdated");i.title="The text this comment quoted has changed.",o.appendChild(i)}n.appendChild(o);const r=l("div","mec-body");return He(r,e.body),n.appendChild(r),n}function Ge(e){if(e===void 0)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}const v={highlight:"rgba(250, 225, 125, 0.5)",highlightStrong:"rgba(250, 225, 125, 0.85)",accent:"#0550ae",text:"#24292f",background:"#ffffff",surface:"#ffffff",border:"rgba(36, 41, 47, 0.18)",muted:"rgba(36, 41, 47, 0.6)"};function V(e,t,n){const o=document.createElement("span");o.className=t,o.textContent="x",o.style.cssText="position:absolute;visibility:hidden;pointer-events:none;top:-9999px",e.appendChild(o);const r=getComputedStyle(o).getPropertyValue(n).trim();return o.remove(),Ke(r)?r:void 0}function Ke(e){if(e.length===0||e==="transparent")return!1;const t=I(e);return t!==void 0&&t.alpha>0}function I(e){const t=e.match(/-?[\d.]+/g);if(t===null||t.length<3)return;const[n,o,r,i]=t.map(Number);return{red:n,green:o,blue:r,alpha:i===void 0?1:i}}function D(e,t){const n=I(e);return n===void 0?e:`rgba(${n.red}, ${n.green}, ${n.blue}, ${t})`}function G(e,t){const n=I(e);return n===void 0?e:D(e,Math.min(1,n.alpha*t))}function je(){const e=s.MarkEdit.editorView?.dom;if(e==null)return v;const t=V(e,"cm-searchMatch","background-color")??v.highlight,n=V(e,"cm-md-header","color")??v.accent,o=getComputedStyle(e).color||v.text,r=Je(e)??v.background;return{highlight:G(t,1),highlightStrong:G(t,1.8),accent:n,text:o,background:r,surface:r,border:D(o,.18),muted:D(o,.55)}}function Je(e){for(let t=e;t!==null;t=t.parentElement){const n=getComputedStyle(t).backgroundColor,o=I(n);if(o!==void 0&&o.alpha>.9)return n}}function p(){const e=je(),t=document.documentElement.style;return t.setProperty("--mec-highlight",e.highlight),t.setProperty("--mec-highlight-strong",e.highlightStrong),t.setProperty("--mec-accent",e.accent),t.setProperty("--mec-text",e.text),t.setProperty("--mec-bg",e.background),t.setProperty("--mec-surface",e.surface),t.setProperty("--mec-border",e.border),t.setProperty("--mec-muted",e.muted),e}function Xe(){p(),typeof s.MarkEdit.onEditorReady=="function"&&s.MarkEdit.onEditorReady(()=>requestAnimationFrame(()=>p())),typeof s.MarkEdit.onEditorConfigChange=="function"&&s.MarkEdit.onEditorConfigChange((...t)=>{t[0]==="theme"&&requestAnimationFrame(()=>p())}),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{requestAnimationFrame(()=>p())}),new MutationObserver(()=>{S!==void 0&&clearTimeout(S),S=setTimeout(()=>{S=void 0,p()},50)}).observe(document.head,{childList:!0,subtree:!0})}let S,b,T,K,A;function Qe(e){T=e,tt(t=>{b=t,rt(t),nt(t),et()})}function Ze(){return b}function et(){if(H()){k();return}s.MarkEdit.onEditorReady(()=>k())}function tt(e){const t=document.querySelector(".markdown-body");if(t!==null){e(t);return}const n=new MutationObserver(()=>{const o=document.querySelector(".markdown-body");o!==null&&(n.disconnect(),e(o))});n.observe(document.body,{childList:!0,subtree:!0})}function nt(e){K=new MutationObserver(()=>B()),K.observe(e,{childList:!0,subtree:!0,characterData:!0})}function B(){A!==void 0&&cancelAnimationFrame(A),A=requestAnimationFrame(()=>{A=void 0,k()})}function k(){b===void 0||!H()||(p(),ke(b,ot()))}function ot(){const e=h();return R(e).filter(t=>T.showResolved||t.resolved!==!0).map(t=>({...t,replyCount:e.filter(n=>n.replyTo===t.id).length}))}function rt(e){e.addEventListener("mouseup",t=>{$(t.target)||setTimeout(()=>se(),0)}),e.addEventListener("click",t=>{const n=Y(t.clientX,t.clientY);n!==void 0&&(t.preventDefault(),t.stopPropagation(),dt(n.id,te(n.id)??new DOMRect(t.clientX,t.clientY,0,0),n.outdated))}),e.addEventListener("mousemove",t=>{const n=Y(t.clientX,t.clientY)!==void 0;e.style.cursor=n?"pointer":""}),document.addEventListener("mousedown",t=>{F()&&!$(t.target)&&f()},!0),document.addEventListener("keydown",t=>{t.key==="Escape"&&F()&&f()})}function se(){if(b===void 0||F())return!1;const e=it(b);return e===void 0||!T.openOnSelect?!1:(ct(e),!0)}function it(e){const t=window.getSelection();if(t===null||t.isCollapsed||t.rangeCount===0)return;const n=t.getRangeAt(0);if(!e.contains(n.commonAncestorContainer)||$(n.commonAncestorContainer))return;const o=Z(e),r=_(o,n.startContainer,n.startOffset),i=_(o,n.endContainer,n.endOffset);if(r===void 0||i===void 0)return;let c=r,d=i;for(;c<d&&/\s/.test(o.text[c]);)c+=1;for(;d>c&&/\s/.test(o.text[d-1]);)d-=1;if(d<=c)return;const a=ee(o,c,d);if(a===void 0)return;const u=we(o,c,d),m=at(e,n.startContainer,n.endContainer);return{...u,range:a,start:c,end:d,line:m?.from,blockEndLine:m?.to??s.MarkEdit.editorAPI.getLineCount()-1,rect:n.getBoundingClientRect()}}function ct(e){Se(e.range),window.getSelection()?.removeAllRanges(),Ue({quote:e.exact,near:e.rect,onCancel:()=>{Ae(),k()},onSubmit:t=>{oe({body:t,exact:e.exact,prefix:e.prefix,suffix:e.suffix,author:ie(T.author),created:new Date().toISOString(),line:e.line},e.blockEndLine)}})}function dt(e,t,n){const o=h(),r=ne(o,e),i=r[0];i!==void 0&&Ye({thread:r,quote:i.exact.length>0?i.exact:"(no quoted text)",outdated:n,near:t,onReply:c=>{oe({body:c,exact:"",prefix:"",suffix:"",replyTo:e,author:ie(T.author),created:new Date().toISOString()},s.MarkEdit.editorAPI.getLineNumber(i.to))},onToggleResolved:()=>{Re(e),B()},onDelete:()=>{re(e),B()}})}function at(e,t,n){const o=[j(e,t),j(e,n)].filter(i=>i!==void 0);if(o.length===0)return;const r=o.map(st).filter(i=>i!==void 0);if(r.length!==0)return{from:Math.min(...r.map(i=>i.from)),to:Math.max(...r.map(i=>i.to))}}function j(e,t){let n=t instanceof HTMLElement?t:t.parentElement;for(;n!==null&&n.parentElement!==e;)n=n.parentElement;return n??void 0}function st(e){const t=[e,...e.querySelectorAll("[data-line-from]")];let n=Number.POSITIVE_INFINITY,o=Number.NEGATIVE_INFINITY;for(const r of t){const i=J(r,"data-line-from"),c=J(r,"data-line-to");i!==void 0&&(n=Math.min(n,i)),c!==void 0&&(o=Math.max(o,c))}return Number.isFinite(n)&&Number.isFinite(o)?{from:n,to:o}:void 0}function J(e,t){const n=e.getAttribute(t);if(n===null)return;const o=Number(n);return Number.isFinite(o)?o:void 0}function lt(){return R(h())}const ut="extension.markeditComments";function mt(){const e=s.MarkEdit.userSettings?.[ut]??{};return{author:typeof e.author=="string"?e.author:void 0,openOnSelect:e.openOnSelect!==!1,showResolved:e.showResolved!==!1}}const ft=mt();s.MarkEdit.addMainMenuItem({title:"Comments",icon:"bubble.left.and.text.bubble.right",children:[{title:"Comment on Selection",key:"M",modifiers:["Shift","Command"],action:()=>{se()||s.MarkEdit.showAlert({title:"Nothing selected",message:"Select text in the preview, then comment on it."})}},{separator:!0},{title:"Next Comment",key:"]",modifiers:["Shift","Command"],action:()=>X(1)},{title:"Previous Comment",key:"[",modifiers:["Shift","Command"],action:()=>X(-1)},{separator:!0},{title:"Copy All Comments",action:()=>ht()},{title:"Delete Resolved Comments",state:()=>({isEnabled:le().length>0}),action:()=>{gt()}},{separator:!0},{title:"Version 0.1.1",action:()=>{}}]});ze();Xe();Qe(ft);function le(){return R(h()).filter(e=>e.resolved===!0)}let P=-1;function X(e){const t=Ze(),n=lt();if(t===void 0||n.length===0)return;P=(P+e+n.length*2)%n.length;const o=n[P].id,r=te(o);if(r===void 0)return;const i=r.top+r.height/2-t.clientHeight/2;t.scrollBy({top:i,behavior:"smooth"}),U(o),setTimeout(()=>U(void 0),900)}function ht(){const e=h(),t=R(e);if(t.length===0){s.MarkEdit.showAlert({title:"No comments",message:"This document has no comments yet."});return}const n=new ClipboardItem({"text/plain":pt(e,t).then(o=>new Blob([o],{type:"text/plain"}))});navigator.clipboard.write([n]).catch(o=>{s.MarkEdit.showAlert({title:"Could not copy comments",message:o instanceof Error?o.message:String(o)})})}async function pt(e,t){const n=typeof s.MarkEdit.getFileInfo=="function"?await s.MarkEdit.getFileInfo():void 0,o=n?.filePath===void 0?"Review comments":`Review comments on ${n.filePath}`,r=t.map((i,c)=>{const d=ne(e,i.id).map(a=>`  ${a.author??"unknown"}: ${a.body.replace(/\n/g,`
  `)}`);return[`${c+1}. ${i.resolved===!0?"[resolved] ":""}on "${i.exact}"`,...d].join(`
`)});return[o,...r].join(`

`)}async function gt(){const e=le();if(!(e.length===0||await s.MarkEdit.showAlert({title:`Delete ${e.length} resolved comment${e.length===1?"":"s"}?`,message:"This removes them from the document. It can be undone with Edit > Undo.",buttons:["Delete","Cancel"]})!==0)){for(const n of e)re(n.id);k()}}
