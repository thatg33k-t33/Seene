// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {SEENE_BRAND} from '../../src/core';
import {SceneLibrary,ScenePreview} from '../../src/preview';
afterEach(()=>{cleanup();vi.restoreAllMocks()});

it.each([SceneLibrary,ScenePreview])('shares installed instructions and recovers clipboard failure in each empty entry',async Component=>{
 const copy=vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(undefined);
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
 render(<Component/>);
 fireEvent.click(screen.getByText(Component===SceneLibrary?'Connect your first scene':'Get started',{exact:true}));
 const content=document.querySelector('.flute-onboarding-content')!;
 expect(content.textContent).toContain('npx seene init');
 expect(content.textContent).toContain('Seene studio');
 fireEvent.click(within(content as HTMLElement).getByRole('button',{name:'Copy description'}));
 await waitFor(()=>expect(within(content as HTMLElement).getByRole('status').textContent).toContain('Clipboard unavailable'));
 expect(content.querySelector('.flute-prompt')!.textContent).toBe(copy.mock.calls[0][0]);
 fireEvent.click(within(content as HTMLElement).getByRole('button',{name:'Copy description'}));
 await screen.findByRole('button',{name:'Description copied'});
 const links=screen.getAllByRole('link',{name:/Web Prodigies/});
 for(const link of links){
  expect(link.getAttribute('href')).toBe(SEENE_BRAND.url);
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  expect(link.getAttribute('target')).toBe('_blank');
 }
 expect(screen.getAllByText(SEENE_BRAND.creator).every(node=>node.tagName==='A')).toBe(true);
});
