import { createRoot } from 'react-dom/client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Surface, type PreviewDefinitionInput } from '../../src';
import { SceneLibrary, ScenePreview } from '../../src/preview';
const Context = createContext('');
const rack = new URLSearchParams(location.search).get("mode") === "focus";
const definition: PreviewDefinitionInput = {width:1400,height:980,
 scene:{version:3,camera:{perspective:1800,rotateX:12,rotateY:-18},focus:{distance:1800,fStop:2.8,maxBlur:6},nodes:[{id:'host'}]},
 motion:{durationMs:4000,tracks:[rack ? {target:{kind:'focus'},property:'distance',keyframes:[{timeMs:0,value:1800},{timeMs:4000,value:1560}]} : {target:{kind:'camera'},property:'x',keyframes:[{timeMs:0,value:-100},{timeMs:4000,value:100}]}]},
};
function Host() {
 const context=useContext(Context);const [count,setCount]=useState(0);
 return <article data-testid="host" style={{background:'#ecebea',color:'#28262e',fontFamily:'Arial',padding:40,height:800}}>
 <h2>{context}</h2><button onClick={()=>setCount(value=>value+1)}>Count {count}</button>
 <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:20,marginTop:30}}>
 {Array.from({length:12}).map((_,i)=><div key={i} style={{background:'#fff',padding:20,borderRadius:12,boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>
 <h3>Card {i+1}</h3><p>Sample card content for preview fixture validation.</p>
 </div>)}
 </div>
 </article>;
}
createRoot(document.getElementById('root')!).render(<Context.Provider value="Fixture tenant"><ScenePreview definition={definition} title="Fixture app"><Host/></ScenePreview></Context.Provider>);
