"use strict";const s=require("markedit-api"),T="<!-- annotation",S="-->",Se=e=>e.replace(/-->/g,"--\\>"),Ae=e=>e.replace(/--\\>/g,"-->");function _(e){return e.replace(/\s+/g," ")}function X(e){const t=[];let n=0;for(;n<e.length;){const o=e.indexOf(T,n);if(o===-1)break;if(o>0&&e[o-1]!==`
`){n=o+T.length;continue}const r=Me(e,o+T.length);if(r===-1)break;const i=Ie(e.slice(o+T.length,r));i!==void 0&&t.push({...i,from:o,to:r+S.length}),n=r+S.length}return t}function Me(e,t){let n=t;for(;n<e.length;){const o=e.indexOf(S,n);if(o===-1)return-1;const r=e.lastIndexOf(`
`,o)+1;if(e.slice(r,o).trim()==="")return o;n=o+S.length}return-1}function Ie(e){const t=e.match(/\n[ \t]*\n/),n=t===null?e:e.slice(0,t.index),o=t===null?"":e.slice((t.index??0)+t[0].length),r=Ne(n),i=r.get("id");if(i===void 0)return;const c=Number(r.get("line"));return{id:i,body:Ae(Re(o)).trim(),exact:r.get("exact")??"",prefix:r.get("prefix")??"",suffix:r.get("suffix")??"",author:r.get("author"),created:r.get("created"),line:Number.isFinite(c)?c:void 0,replyTo:r.get("reply-to"),resolved:r.get("resolved")==="true"}}function Re(e){return e.replace(/\n[ \t]*$/,"")}function Ne(e){const t=new Map,n=/([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;for(const o of e.matchAll(n)){const[,r,i,c]=o;if(i!==void 0)try{t.set(r,JSON.parse(`"${i}"`))}catch{t.set(r,i)}else t.set(r,c)}return t}function he(e){const t=r=>JSON.stringify(r),n=[`id=${e.id}`];e.author!==void 0&&n.push(`author=${t(e.author)}`),e.created!==void 0&&n.push(`created=${t(e.created)}`),e.line!==void 0&&n.push(`line=${e.line}`),e.replyTo!==void 0&&n.push(`reply-to=${e.replyTo}`),e.resolved===!0&&n.push("resolved=true");const o=[T,n.join(" ")];return e.replyTo===void 0&&o.push([`exact=${t(e.exact)}`,`prefix=${t(e.prefix)}`,`suffix=${t(e.suffix)}`].join(" ")),o.push("",Se(e.body.trim()),S),o.join(`
`)}function Le(e){const t=new Set(e);for(let n=1;;n+=1){const o=`c${n}`;if(!t.has(o))return o}}const oe=48;function Pe(e,t){const n=_(t.exact);if(n.length===0)return;const o=[];for(let d=e.text.indexOf(n);d!==-1;d=e.text.indexOf(n,d+1))o.push(d);if(o.length===0)return;if(o.length===1)return{start:o[0],end:o[0]+n.length,outdated:!1};const r=_(t.prefix),i=_(t.suffix);let c=o[0],a=-1;for(const d of o){const l=e.text.slice(Math.max(0,d-r.length),d),m=e.text.slice(d+n.length,d+n.length+i.length),C=Fe(l,r)+Oe(m,i);C>a&&(c=d,a=C)}return{start:c,end:c+n.length,outdated:!1}}function Oe(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[o]===t[o];)o+=1;return o}function Fe(e,t){const n=Math.min(e.length,t.length);let o=0;for(;o<n&&e[e.length-1-o]===t[t.length-1-o];)o+=1;return o}function De(e,t,n){return{exact:e.text.slice(t,n),prefix:e.text.slice(Math.max(0,t-oe),t),suffix:e.text.slice(n,n+oe)}}const L="data-mec-ui",$e=e=>/\s/.test(e);function fe(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,{acceptNode:i=>{const c=i.parentElement;return c===null||c.closest(`[${L}]`)!==null||c.closest("style, script, svg style, svg script")!==null?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),n=[],o=[],r=[];for(let i=t.nextNode();i!==null;i=t.nextNode()){const c=i,a=c.data;for(let d=0;d<a.length;d+=1){const l=a[d];if($e(l)){if(n.length===0||n[n.length-1]===" ")continue;n.push(" ")}else n.push(l);o.push(c),r.push(d)}}return{text:n.join(""),nodes:o,offsets:r}}function re(e,t,n){if(t.nodeType!==Node.TEXT_NODE){const r=e.nodes.findIndex(i=>t.contains(i));return r===-1?void 0:r}let o;for(let r=0;r<e.nodes.length;r+=1)if(e.nodes[r]===t){if(e.offsets[r]>=n)return r;o=r+1}return o}function pe(e,t,n){const o=e.nodes[t],r=e.nodes[n-1];if(o===void 0||r===void 0)return;const i=document.createRange();return i.setStart(o,e.offsets[t]),i.setEnd(r,Math.min(e.offsets[n-1]+1,r.data.length)),i}const v={comment:"mec-comment",resolved:"mec-comment-resolved",outdated:"mec-comment-outdated",pending:"mec-comment-pending",active:"mec-comment-active"};let E=[];function Be(){return typeof CSS<"u"&&"highlights"in CSS&&typeof Highlight=="function"}function qe(e,t){const n=fe(e),o={comment:[],resolved:[],outdated:[]};E=[];for(const r of t){const i=ze(e,n,r);if(i===void 0)continue;const{range:c,outdated:a}=i;E.push({id:r.id,range:c,outdated:a,replyCount:r.replyCount??0});const d=a?"outdated":r.resolved===!0?"resolved":"comment";o[d].push(c)}x(v.comment,o.comment),x(v.resolved,o.resolved),x(v.outdated,o.outdated),x(v.pending,[])}function ze(e,t,n){const o=Pe(t,n);if(o!==void 0){const c=pe(t,o.start,o.end);return c===void 0?void 0:{range:c,outdated:!1}}const r=Ue(e,n.line);if(r===void 0||r.textContent===null||r.textContent.trim().length===0)return;const i=document.createRange();return i.selectNodeContents(r),{range:i,outdated:!0}}const ie=new Map;function x(e,t){if(!Be())return;let n=ie.get(e);n===void 0&&(n=new Highlight,ie.set(e,n),CSS.highlights.set(e,n)),n.clear();for(const o of t)n.add(o)}function He(e){x(v.pending,[e])}function We(){x(v.pending,[])}function Y(e){const t=E.find(n=>n.id===e);x(v.active,t===void 0?[]:[t.range])}function ce(e,t){const n=document.caretRangeFromPoint?.(e,t);if(n!=null)for(const o of E)try{if(o.range.comparePoint(n.startContainer,n.startOffset)===0)return{id:o.id,outdated:o.outdated}}catch{}}function _e(){return new Set(E.filter(e=>e.outdated).map(e=>e.id))}function $(e){const t=E.find(o=>o.id===e);if(t===void 0)return;const n=t.range.getBoundingClientRect();return n.width===0&&n.height===0?void 0:n}function Ue(e,t){if(t===void 0)return;let n,o=Number.POSITIVE_INFINITY;for(const r of e.querySelectorAll("[data-line-from]")){const i=Number(r.getAttribute("data-line-from")),c=r.getAttribute("data-line-to"),a=c===null?i:Number(c);if(!Number.isFinite(i)||!Number.isFinite(a))continue;const d=t>=i&&t<=a?0:Math.min(Math.abs(t-i),Math.abs(t-a));d<o&&(n=r,o=d)}return n}function Ye(e){const t=[],n=e.split(`
`);let o=0,r;for(const[i,c]of n.entries()){const a=o;o+=c.length+1;const d=Math.min(o-1,e.length);if(i===0&&/^---\s*$/.test(c)){const C=n.findIndex((H,W)=>W>0&&/^(---|\.\.\.)\s*$/.test(H));if(C>0){const H=n.slice(0,C+1).reduce((W,Te)=>W+Te.length+1,0);t.push({from:0,to:Math.min(H-1,e.length)})}continue}const l=c.match(/^ {0,3}(`{3,}|~{3,})/);if(l===null)continue;const m=l[1][0];if(r===void 0){r={marker:m,length:l[1].length,from:a};continue}m===r.marker&&l[1].length>=r.length&&c.slice(l[1].length).trim()===""&&(t.push({from:r.from,to:d}),r=void 0)}return r!==void 0&&t.push({from:r.from,to:e.length}),t}function Ge(e,t){let n=Math.max(0,Math.min(t,e.length));for(let o=0;o<8;o+=1){const r=Ye(e).find(i=>n>i.from&&n<i.to);if(r===void 0)return n;n=r.to}return n}function p(){return Q()?X(s.MarkEdit.editorAPI.getText()):[]}function Q(){return s.MarkEdit.editorView?.state!==void 0}function ge(e,t){const n=e.find(o=>o.id===t);return n===void 0?[]:[n,...e.filter(o=>o.replyTo===t)]}function B(e){return e.filter(t=>t.replyTo===void 0)}function Z(e,t){const n=s.MarkEdit.editorAPI,o=n.getText(),r=X(o),i={...e,id:Le(r.map(l=>l.id))},c=Ke(o,Je(t)),a=Xe(o,r,Ge(o,c)),d=`

${he(i)}${je(o,a)}`;return n.setText(d,{from:a,to:a}),i.id}function Ve(e,t){const o=p().find(a=>a.id===e);if(o===void 0)return;const{from:r,to:i,...c}=o;s.MarkEdit.editorAPI.setText(he({...c,...t}),{from:r,to:i})}function ee(e){const t=s.MarkEdit.editorAPI,n=t.getText(),i=[...X(n).filter(c=>c.id===e||c.replyTo===e)].sort((c,a)=>a.from-c.from);for(const c of i){const a=n.startsWith(`

`,c.from-2)?c.from-2:c.from;t.setText("",{from:a,to:c.to})}}function be(e){const t=p().find(n=>n.id===e);t!==void 0&&Ve(e,{resolved:t.resolved!==!0})}function Ke(e,t){let n=t;for(;n>0;){const o=e.lastIndexOf(`
`,n-1)+1;if(e.slice(o,n).trim()!=="")return n;n=o===0?0:o-1}return n}function je(e,t){const n=e.slice(t);return n.trim().length===0||n.startsWith(`

`)?"":n.startsWith(`
`)?`
`:`

`}function Je(e){const t=s.MarkEdit.editorAPI,n=Math.max(0,Math.min(e,t.getLineCount()-1));return t.getLineRange(n).to}function Xe(e,t,n){let o=n;for(;;){const r=t.find(i=>i.from>=o&&e.slice(o,i.from).trim()==="");if(r===void 0)return o;o=r.to}}function te(e){if(typeof e=="string"&&e.length>0)return e;try{return s.MarkEdit.getDirectoryPath("home").match(/^\/Users\/([^/]+)/)?.[1]??"me"}catch{return"me"}}const Qe=new Set(["P","BR","HR","SPAN","DIV","STRONG","B","EM","I","DEL","S","MARK","SUP","SUB","CODE","PRE","KBD","SAMP","A","UL","OL","LI","BLOCKQUOTE","H1","H2","H3","H4","H5","H6","TABLE","THEAD","TBODY","TR","TH","TD","IMG","INPUT"]),Ze=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","FORM","LINK","META","BASE","NOSCRIPT"]),et=new Set(["href","src","alt","title","type","checked","disabled","colspan","rowspan"]);function tt(e){const t=e.trim().toLowerCase();return t.startsWith("#")||t.startsWith("/")||t.startsWith("./")||t.startsWith("../")?!0:/^(https?|mailto):/.test(t)}function nt(e){for(const t of[...e.querySelectorAll("*")]){if(Ze.has(t.tagName)){t.remove();continue}if(!Qe.has(t.tagName)){t.replaceWith(...t.childNodes);continue}for(const n of[...t.attributes]){const o=n.name.toLowerCase();et.has(o)&&!o.startsWith("on")&&(o!=="href"&&o!=="src"||tt(n.value))||t.removeAttribute(n.name)}t.tagName==="A"&&(t.setAttribute("target","_blank"),t.setAttribute("rel","noopener noreferrer")),t.tagName==="INPUT"&&t.setAttribute("disabled","")}}async function ot(e,t){e.textContent=t;const n=window.MarkEditRenderHtml;if(typeof n=="function")try{const o=await n(t,!1),r=document.createElement("template");if(r.innerHTML=o.replace(/^\s*<meta charset="UTF-8">\s*/i,""),nt(r.content),r.content.textContent?.trim().length===0)return;e.textContent="",e.appendChild(r.content),e.classList.add("mec-rendered")}catch{}}const rt=`/*
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
  /*
   * Wide enough for a line of code without horizontal scrolling, which comments
   * from an agent routinely contain, while still yielding on a narrow window.
   */
  width: 480px;
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
  max-height: 50vh;
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
}

/*
 * Code wraps rather than scrolling sideways. A comment is read in place, and a
 * line that runs past the edge of a panel this size is easier to follow wrapped
 * than behind a scrollbar that has to be found first.
 */
.mec-body.mec-rendered pre code {
  padding: 0;
  background: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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

/* Comments rail */

:root {
  --mec-rail-width: 300px;
}

.mec-rail {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 2147482000;
  display: none;
  width: var(--mec-rail-width);
  overflow: hidden;
  border-left: 1px solid var(--mec-border);
  background-color: var(--mec-surface);
}

.mec-sidebar-open .mec-rail {
  display: block;
}

/*
 * Reserve the rail's width inside the preview rather than overlaying it, so no
 * text ends up underneath. Qualified with the tag to outrank the preview's own
 * padding rule, which is a single class.
 */
.mec-sidebar-open div.markdown-body {
  padding-right: calc(var(--mec-rail-width) + 25px);
}

.mec-rail-empty {
  padding: 16px 14px;
  color: var(--mec-muted);
  font: caption;
  font-size: 12px;
}

.mec-card {
  position: absolute;
  left: 10px;
  right: 10px;
  box-sizing: border-box;
  padding: 9px 10px;
  border: 1px solid var(--mec-border);
  border-radius: 9px;
  background-color: var(--mec-bg);
  color: var(--mec-text);
  font: caption;
  font-size: 12px;
  line-height: 1.45;
  /* Cards move as the reader scrolls; animating that would lag behind the text. */
  transition: box-shadow 0.12s ease-out, opacity 0.12s ease-out;
}

.mec-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.mec-card.mec-card-active {
  border-color: var(--mec-accent);
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.18);
}

/* An anchor scrolled out of view keeps its place, but recedes. */
.mec-card.mec-card-offscreen {
  opacity: 0.45;
}

.mec-card.mec-card-resolved .mec-body {
  color: var(--mec-muted);
}

.mec-card .mec-quote {
  margin-bottom: 6px;
  max-height: 2.2em;
}

/* The reply box and actions belong to the focused thread only, as they would
   otherwise triple the height of every card in the rail. */
.mec-card .mec-card-input,
.mec-card .mec-card-actions {
  display: none;
}

.mec-card.mec-card-active .mec-card-input,
.mec-card.mec-card-active .mec-card-actions {
  display: flex;
}

.mec-card .mec-card-input {
  min-height: 50px;
  margin-top: 6px;
}

.mec-card.mec-card-active .mec-card-input {
  display: block;
}

.mec-card .mec-thread {
  max-height: none;
}
`;let D,G;function it(){const e=document.createElement("style");e.textContent=rt,e.setAttribute(L,""),document.head.appendChild(e)}function h(){const e=G;D?.remove(),D=void 0,G=void 0,e?.()}function V(){return D!==void 0}function K(e){const t=e instanceof Element?e:e?.parentElement??null;return t?.closest(`[${L}]`)!==null&&t!==null}function ve(e,t,n){h(),e.classList.add("mec-panel"),e.setAttribute(L,""),document.body.appendChild(e),ct(e,t),D=e,G=n}function ct(e,t){const{width:o,height:r}=e.getBoundingClientRect(),i=Math.min(Math.max(8,t.left),Math.max(8,window.innerWidth-o-8)),c=t.bottom+8,a=c+r>window.innerHeight-8?Math.max(8,t.top-r-8):c;e.style.left=`${Math.round(i)}px`,e.style.top=`${Math.round(a)}px`}function u(e,t,n){const o=document.createElement(e);return t!==void 0&&(o.className=t),n!==void 0&&(o.textContent=n),o}function ne(e,t){const n=document.createElement("textarea");return n.className="mec-input",n.placeholder=e,n.rows=3,n.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey?(o.preventDefault(),o.stopPropagation(),t()):o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),h())}),n}function xe(e,t){const n=u("div","mec-actions");return n.appendChild(u("span","mec-hint",e)),t.forEach(o=>n.appendChild(o)),n}function b(e,t,n){const o=document.createElement("button");return o.className=`mec-button ${t}`,o.textContent=e,o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),n()}),o}function at({quote:e,near:t,onSubmit:n,onCancel:o}){const r=u("div");let i=!1;const c=()=>{const l=a.value.trim();l.length!==0&&(i=!0,h(),n(l))},a=ne("Comment on the highlighted text…",c),d=b("Comment","mec-primary",c);d.disabled=!0,a.addEventListener("input",()=>{d.disabled=a.value.trim().length===0}),r.appendChild(u("div","mec-quote",e)),r.appendChild(a),r.appendChild(xe("↵ to save",[b("Cancel","",h),d])),ve(r,t,()=>{i||o()}),a.focus()}function dt(e){const{thread:t,quote:n,outdated:o,near:r}=e,[i]=t;if(i===void 0)return;const c=u("div");c.appendChild(u("div","mec-quote",n));const a=u("div","mec-thread");for(const m of t)a.appendChild(j(m,o&&m===i));c.appendChild(a);const d=()=>{const m=l.value.trim();m.length>0&&(h(),e.onReply(m))},l=ne("Reply…",d);c.appendChild(l),c.appendChild(xe("",[b("Delete","mec-danger",()=>{h(),e.onDelete()}),b(i.resolved===!0?"Reopen":"Resolve","",()=>{h(),e.onToggleResolved()}),b("Reply","mec-primary",d)])),ve(c,r)}function j(e,t){const n=u("div","mec-comment"),o=u("div","mec-byline");if(o.appendChild(u("span","mec-author",e.author??"unknown")),o.appendChild(u("span","",st(e.created))),e.resolved===!0&&o.appendChild(u("span","mec-flag","resolved")),t){const i=u("span","mec-flag","outdated");i.title="The text this comment quoted has changed.",o.appendChild(i)}n.appendChild(o);const r=u("div","mec-body");return ot(r,e.body),n.appendChild(r),n}function st(e){if(e===void 0)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}const lt=8,ut=12;let g,A,M=new Map,P;function q(){return document.documentElement.classList.contains("mec-sidebar-open")}function mt(e,t){A=t,g=u("div","mec-rail"),g.setAttribute(L,""),document.body.appendChild(g),e.addEventListener("scroll",I,{passive:!0}),window.addEventListener("resize",I)}function ht(){const e=!q();return document.documentElement.classList.toggle("mec-sidebar-open",e),I(),e}function ft(e){document.documentElement.classList.toggle("mec-sidebar-open",e),I()}function ye(e){for(const[n,o]of M)o.classList.toggle("mec-card-active",n===e);Y(e),we(),(e===void 0?void 0:M.get(e))?.scrollIntoView({block:"nearest",behavior:"smooth"})}function pt(e){if(g!==void 0){if(g.textContent="",M=new Map,e.length===0){g.appendChild(u("div","mec-rail-empty","No comments yet."));return}for(const t of e){const n=gt(t);M.set(t.root.id,n),g.appendChild(n)}I()}}function gt(e){const{root:t,replies:n,outdated:o}=e,r=u("div","mec-card");r.dataset.mecCard=t.id,t.resolved===!0&&r.classList.add("mec-card-resolved"),r.appendChild(u("div","mec-quote",t.exact.length>0?t.exact:"(no quoted text)")),r.appendChild(j(t,o));for(const a of n)r.appendChild(j(a,!1));const i=()=>{const a=c.value.trim();a.length>0&&(c.value="",A?.onReply(t.id,a))},c=ne("Reply…",i);return c.classList.add("mec-card-input"),r.appendChild(c),r.appendChild(bt(t,i)),r.addEventListener("mousedown",a=>{a.target.closest("button, textarea")===null&&(ye(t.id),A?.onFocusAnchor(t.id))}),r}function bt(e,t){const n=u("div","mec-actions mec-card-actions");return n.appendChild(u("span","mec-hint")),n.appendChild(b("Delete","mec-danger",()=>A?.onDelete(e.id))),n.appendChild(b(e.resolved===!0?"Reopen":"Resolve","",()=>A?.onToggleResolved(e.id))),n.appendChild(b("Reply","mec-primary",t)),n}function I(){P!==void 0&&cancelAnimationFrame(P),P=requestAnimationFrame(()=>{P=void 0,we()})}function we(){if(g===void 0||!q())return;let e=ut;for(const[t,n]of M){const o=$(t),r=o===void 0?e:o.top,i=Math.max(r,e);n.style.top=`${Math.round(i)}px`,n.classList.toggle("mec-card-offscreen",o===void 0),e=i+n.offsetHeight+lt}}const k={highlight:"rgba(250, 225, 125, 0.5)",highlightStrong:"rgba(250, 225, 125, 0.85)",accent:"#0550ae",text:"#24292f",background:"#ffffff",surface:"#ffffff",border:"rgba(36, 41, 47, 0.18)",muted:"rgba(36, 41, 47, 0.6)"};function ae(e,t,n){const o=document.createElement("span");o.className=t,o.textContent="x",o.style.cssText="position:absolute;visibility:hidden;pointer-events:none;top:-9999px",e.appendChild(o);const r=getComputedStyle(o).getPropertyValue(n).trim();return o.remove(),vt(r)?r:void 0}function vt(e){if(e.length===0||e==="transparent")return!1;const t=z(e);return t!==void 0&&t.alpha>0}function z(e){const t=e.match(/-?[\d.]+/g);if(t===null||t.length<3)return;const[n,o,r,i]=t.map(Number);return{red:n,green:o,blue:r,alpha:i===void 0?1:i}}function J(e,t){const n=z(e);return n===void 0?e:`rgba(${n.red}, ${n.green}, ${n.blue}, ${t})`}function de(e,t){const n=z(e);return n===void 0?e:J(e,Math.min(1,n.alpha*t))}function xt(){const e=s.MarkEdit.editorView?.dom;if(e==null)return k;const t=ae(e,"cm-searchMatch","background-color")??k.highlight,n=ae(e,"cm-md-header","color")??k.accent,o=getComputedStyle(e).color||k.text,r=yt(e)??k.background;return{highlight:de(t,1),highlightStrong:de(t,1.8),accent:n,text:o,background:r,surface:r,border:J(o,.18),muted:J(o,.55)}}function yt(e){for(let t=e;t!==null;t=t.parentElement){const n=getComputedStyle(t).backgroundColor,o=z(n);if(o!==void 0&&o.alpha>.9)return n}}function w(){const e=xt(),t=document.documentElement.style;return t.setProperty("--mec-highlight",e.highlight),t.setProperty("--mec-highlight-strong",e.highlightStrong),t.setProperty("--mec-accent",e.accent),t.setProperty("--mec-text",e.text),t.setProperty("--mec-bg",e.background),t.setProperty("--mec-surface",e.surface),t.setProperty("--mec-border",e.border),t.setProperty("--mec-muted",e.muted),e}function wt(){w(),typeof s.MarkEdit.onEditorReady=="function"&&s.MarkEdit.onEditorReady(()=>requestAnimationFrame(()=>w())),typeof s.MarkEdit.onEditorConfigChange=="function"&&s.MarkEdit.onEditorConfigChange((...t)=>{t[0]==="theme"&&requestAnimationFrame(()=>w())}),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{requestAnimationFrame(()=>w())}),new MutationObserver(()=>{O!==void 0&&clearTimeout(O),O=setTimeout(()=>{O=void 0,w()},50)}).observe(document.head,{childList:!0,subtree:!0})}let O;const Ee="mec.sidebar-open";let f,y,se,F;function Et(e){y=e,Tt(t=>{f=t,Pt(t),St(t),mt(t,{onReply:(o,r)=>Mt(o,r),onToggleResolved:o=>{be(o),R()},onDelete:o=>{ee(o),R()},onFocusAnchor:o=>It(o)});const n=localStorage.getItem(Ee);ft(n===null?y.sidebar:n==="true"),kt()})}function Ct(){return f}function kt(){if(Q()){N();return}s.MarkEdit.onEditorReady(()=>N())}function Tt(e){const t=document.querySelector(".markdown-body");if(t!==null){e(t);return}const n=new MutationObserver(()=>{const o=document.querySelector(".markdown-body");o!==null&&(n.disconnect(),e(o))});n.observe(document.body,{childList:!0,subtree:!0})}function St(e){se=new MutationObserver(()=>R()),se.observe(e,{childList:!0,subtree:!0,characterData:!0})}function R(){F!==void 0&&cancelAnimationFrame(F),F=requestAnimationFrame(()=>{F=void 0,N()})}function N(){if(f===void 0||!Q())return;w();const e=Lt();qe(f,e),At(e)}function At(e){const t=p(),n=_e();pt(e.map(o=>({root:o,replies:t.filter(r=>r.replyTo===o.id),outdated:n.has(o.id)})))}function Mt(e,t){const n=p().find(o=>o.id===e);n!==void 0&&Z({body:t,exact:"",prefix:"",suffix:"",replyTo:e,author:te(y.author),created:new Date().toISOString()},s.MarkEdit.editorAPI.getLineNumber(n.to))}function It(e){const t=$(e);if(t===void 0||f===void 0)return;const n=t.top+t.height/2-f.clientHeight/2;f.scrollBy({top:n,behavior:"smooth"})}function Rt(){const e=ht();return localStorage.setItem(Ee,String(e)),e}function Nt(){return q()}function Lt(){const e=p();return B(e).filter(t=>y.showResolved||t.resolved!==!0).map(t=>({...t,replyCount:e.filter(n=>n.replyTo===t.id).length}))}function Pt(e){e.addEventListener("mouseup",t=>{K(t.target)||setTimeout(()=>Ce(),0)}),e.addEventListener("click",t=>{const n=ce(t.clientX,t.clientY);if(n!==void 0){if(t.preventDefault(),t.stopPropagation(),q()){ye(n.id);return}Dt(n.id,$(n.id)??new DOMRect(t.clientX,t.clientY,0,0),n.outdated)}}),e.addEventListener("mousemove",t=>{if(t.buttons!==0)return;const n=ce(t.clientX,t.clientY)===void 0?"":"pointer";e.style.cursor!==n&&(e.style.cursor=n)}),document.addEventListener("mousedown",t=>{V()&&!K(t.target)&&h()},!0),document.addEventListener("keydown",t=>{t.key==="Escape"&&V()&&h()})}function Ce(){if(f===void 0||V())return!1;const e=Ot(f);return e===void 0||!y.openOnSelect?!1:(Ft(e),!0)}function Ot(e){const t=window.getSelection();if(t===null||t.isCollapsed||t.rangeCount===0)return;const n=t.getRangeAt(0);if(!e.contains(n.commonAncestorContainer)||K(n.commonAncestorContainer))return;const o=fe(e),r=re(o,n.startContainer,n.startOffset),i=re(o,n.endContainer,n.endOffset);if(r===void 0||i===void 0)return;let c=r,a=i;for(;c<a&&/\s/.test(o.text[c]);)c+=1;for(;a>c&&/\s/.test(o.text[a-1]);)a-=1;if(a<=c)return;const d=pe(o,c,a);if(d===void 0)return;const l=De(o,c,a),m=$t(e,n.startContainer,n.endContainer);return{...l,range:d,start:c,end:a,line:m?.from,blockEndLine:m?.to??s.MarkEdit.editorAPI.getLineCount()-1,rect:n.getBoundingClientRect()}}function Ft(e){He(e.range),at({quote:e.exact,near:e.rect,onCancel:()=>{We(),N()},onSubmit:t=>{Z({body:t,exact:e.exact,prefix:e.prefix,suffix:e.suffix,author:te(y.author),created:new Date().toISOString(),line:e.line},e.blockEndLine)}})}function Dt(e,t,n){const o=p(),r=ge(o,e),i=r[0];i!==void 0&&dt({thread:r,quote:i.exact.length>0?i.exact:"(no quoted text)",outdated:n,near:t,onReply:c=>{Z({body:c,exact:"",prefix:"",suffix:"",replyTo:e,author:te(y.author),created:new Date().toISOString()},s.MarkEdit.editorAPI.getLineNumber(i.to))},onToggleResolved:()=>{be(e),R()},onDelete:()=>{ee(e),R()}})}function $t(e,t,n){const o=[le(e,t),le(e,n)].filter(i=>i!==void 0);if(o.length===0)return;const r=o.map(Bt).filter(i=>i!==void 0);if(r.length!==0)return{from:Math.min(...r.map(i=>i.from)),to:Math.max(...r.map(i=>i.to))}}function le(e,t){let n=t instanceof HTMLElement?t:t.parentElement;for(;n!==null&&n.parentElement!==e;)n=n.parentElement;return n??void 0}function Bt(e){const t=[e,...e.querySelectorAll("[data-line-from]")];let n=Number.POSITIVE_INFINITY,o=Number.NEGATIVE_INFINITY;for(const r of t){const i=ue(r,"data-line-from"),c=ue(r,"data-line-to");i!==void 0&&(n=Math.min(n,i)),c!==void 0&&(o=Math.max(o,c))}return Number.isFinite(n)&&Number.isFinite(o)?{from:n,to:o}:void 0}function ue(e,t){const n=e.getAttribute(t);if(n===null)return;const o=Number(n);return Number.isFinite(o)?o:void 0}function qt(){return B(p())}const zt="extension.markeditComments";function Ht(){const e=s.MarkEdit.userSettings?.[zt]??{};return{author:typeof e.author=="string"?e.author:void 0,openOnSelect:e.openOnSelect!==!1,showResolved:e.showResolved!==!1,sidebar:e.sidebar===!0}}const Wt=Ht();s.MarkEdit.addMainMenuItem({title:"Comments",icon:"bubble.left.and.text.bubble.right",children:[{title:"Comment on Selection",key:"M",modifiers:["Shift","Command"],action:()=>{Ce()||s.MarkEdit.showAlert({title:"Nothing selected",message:"Select text in the preview, then comment on it."})}},{title:"Show Comments Sidebar",key:"\\",modifiers:["Shift","Command"],state:()=>({isSelected:Nt()}),action:()=>{Rt()}},{separator:!0},{title:"Next Comment",key:"]",modifiers:["Shift","Command"],action:()=>me(1)},{title:"Previous Comment",key:"[",modifiers:["Shift","Command"],action:()=>me(-1)},{separator:!0},{title:"Copy All Comments",action:()=>_t()},{title:"Delete Resolved Comments",state:()=>({isEnabled:ke().length>0}),action:()=>{Yt()}},{separator:!0},{title:"Version 0.1.2",action:()=>{}}]});it();wt();Et(Wt);function ke(){return B(p()).filter(e=>e.resolved===!0)}let U=-1;function me(e){const t=Ct(),n=qt();if(t===void 0||n.length===0)return;U=(U+e+n.length*2)%n.length;const o=n[U].id,r=$(o);if(r===void 0)return;const i=r.top+r.height/2-t.clientHeight/2;t.scrollBy({top:i,behavior:"smooth"}),Y(o),setTimeout(()=>Y(void 0),900)}function _t(){const e=p(),t=B(e);if(t.length===0){s.MarkEdit.showAlert({title:"No comments",message:"This document has no comments yet."});return}const n=new ClipboardItem({"text/plain":Ut(e,t).then(o=>new Blob([o],{type:"text/plain"}))});navigator.clipboard.write([n]).catch(o=>{s.MarkEdit.showAlert({title:"Could not copy comments",message:o instanceof Error?o.message:String(o)})})}async function Ut(e,t){const n=typeof s.MarkEdit.getFileInfo=="function"?await s.MarkEdit.getFileInfo():void 0,o=n?.filePath===void 0?"Review comments":`Review comments on ${n.filePath}`,r=t.map((i,c)=>{const a=ge(e,i.id).map(d=>`  ${d.author??"unknown"}: ${d.body.replace(/\n/g,`
  `)}`);return[`${c+1}. ${i.resolved===!0?"[resolved] ":""}on "${i.exact}"`,...a].join(`
`)});return[o,...r].join(`

`)}async function Yt(){const e=ke();if(!(e.length===0||await s.MarkEdit.showAlert({title:`Delete ${e.length} resolved comment${e.length===1?"":"s"}?`,message:"This removes them from the document. It can be undone with Edit > Undo.",buttons:["Delete","Cancel"]})!==0)){for(const n of e)ee(n.id);N()}}
