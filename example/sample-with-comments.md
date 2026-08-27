# Comment anchoring test

The quick brown fox jumps over the lazy dog. This paragraph exists so we
have ordinary prose to annotate.

<!-- annotation
id=c1 author="anchit.rao" created="2026-08-26T22:35:42.113Z" line=2
exact="brown fox" prefix="Comment anchoring test The quick " suffix=" jumps over the lazy dog. This paragraph exists "

Cliché — pick a concrete example instead.
-->

<!-- annotation
id=c6 author="claude" created="2026-08-26T22:41:10.004Z" reply-to=c1

Replaced it with a worked example in the next revision.
-->

## A table

| Feature  | Status |
| -------- | ------ |
| Comments | Draft  |
| Anchors  | Done   |

<!-- annotation
id=c2 author="anchit.rao" created="2026-08-26T22:35:43.201Z" line=14
exact="Draft" prefix="se to annotate. A table Feature Status Comments " suffix=" Anchors Done A code fence const timeout = 5000;"

Should this say "In review"?
-->

## A code fence

```js
const timeout = 5000;
fetchUser(id).then(render);
```

<!-- annotation
id=c3 author="anchit.rao" created="2026-08-26T22:35:44.310Z" line=28
exact="timeout" prefix=" Comments Draft Anchors Done A code fence const " suffix=" = 5000; fetchUser(id).then(render); A list firs"

Make this configurable rather than hard-coded.
-->
