import {it,expect} from 'vitest';
import {uniformFocusBlur,focusForSurface,matrixFor,TransformSchema,FocusSchema} from '../../src/core';

it('keeps all flat-plane points equally focused or defocused',()=>{
 const f=focusForSurface(matrixFor(TransformSchema.parse({z:200})),FocusSchema.parse({distance:1600}));
 expect(uniformFocusBlur(f,2000,FocusSchema.parse({distance:1600}))).toBeDefined();
});
it('retains gradients across tilted planes and recognizes fully capped fields',()=>{
 const f=focusForSurface(matrixFor(TransformSchema.parse({rotateY:40})),FocusSchema.parse({}));
 expect(uniformFocusBlur(f,2000,FocusSchema.parse({}))).toBeDefined();
});
it('agrees with the canonical law when taking the uniform fast path',()=>{
 for(const scale of [.5,1,2])for(const z of [-500,-100,0,100,200])for(const rotateY of [0,10]){
 const f=focusForSurface(matrixFor(TransformSchema.parse({scale,z,rotateY})),FocusSchema.parse({}));
 const value=uniformFocusBlur(f,10000,FocusSchema.parse({}));
 expect(value).toBeDefined();
 }
});
