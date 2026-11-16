import test from "node:test";
import assert from "node:assert/strict";
import * as core from "../docs/tool.mjs";

test("counts and sums by two dimensions, including reserved names", () => {
  const csv="Group,Item,Qty\n__proto__,constructor,2\n__proto__,constructor,3\nEast,Tea,1";
  assert.deepEqual(core.pivot(csv,"Group","Item","Qty","sum"),[["Group","constructor","Tea"],["__proto__",5,0],["East",0,1]]);
  assert.deepEqual(core.pivot(csv,"Group","Item","","count")[1],["__proto__",2,0]);
  assert.throws(() => core.pivot(csv.replace(",2",",3kg"),"Group","Item","Qty","sum"),/Non-numeric/);
});
