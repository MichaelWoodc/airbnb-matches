const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={license_not_shown:'Licensed address — license not shown',unlicensed:'Unlicensed flag — no county record found',review:'License status unresolved',outside_scope:'Other municipality',license_shown:'License shown'},colors={license_not_shown:'#087e8b',unlicensed:'#c32d40',review:'#b88213',outside_scope:'#77818c',license_shown:'#3869af'};
function popupContent(r){
 const value=x=>x===undefined||x===null||x===''?'Not recorded':esc(x);
 const reportBase='https://docs.google.com/forms/d/e/1FAIpQLSf0UzTMk7k2NIsRYuNL54MmFjRmVHlXTXGVMsBnyUZYjNoJzA/viewform';
 const report=(license='')=>reportBase+'?'+new URLSearchParams({usp:'pp_url','entry.1013247072':r.airbnb_url,'entry.1545663527':r.address,'entry.1993836701':license});
 const dead='https://docs.google.com/forms/d/e/1FAIpQLSfdo8vwaQGlBQY8P_gHeZVdnGilHoVvnaqqDawClCIzfo7FDQ/viewform?'+new URLSearchParams({usp:'pp_url','entry.84751625':r.airbnb_url});
 const complaint='https://stvr-doorman.github.io/chatham_county_stvr_map/complaint_intro.html?'+new URLSearchParams({address:r.address,unit:r.unit||'',municipality:r.jurisdiction,host_name:r.host_name||'',url:r.airbnb_url,rental_type:r.rental_type||'',lat:r.latitude,lng:r.longitude});
 const button=(url,label,extra='')=>'<a class="popup-action '+extra+'" target="_blank" rel="noopener" href="'+esc(url)+'">'+esc(label)+'</a>';
 const addressLabel=r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address';
 let status=r.category==='unlicensed'?'⚠️ Likely unlicensed — no county license record found':labels[r.category];
 return `<section class="listing-popup"><h3>${esc(r.listing_title||'Airbnb '+r.airbnb)}</h3><div>${value(r.rental_type)}</div><p><b>${addressLabel}:</b> ${esc(r.address)} ${esc(r.unit)}<br><b>Host:</b> ${value(r.host_name)}<br><b>Advertised capacity:</b> ${value(r.advertised_capacity)}<br><b>Bedrooms:</b> ${value(r.bedrooms)}<br><b>Legal limit:</b> ${r.legal_limit?esc(r.legal_limit)+' (license record)':'Not established'}</p><p class="popup-status" style="border-color:${colors[r.category]}">${esc(status)}</p><p><b>Licensing jurisdiction:</b> ${esc(r.jurisdiction)}<br>${esc(r.matched_permits||'No matching active license record')}</p>${r.rental_term_note?`<p><b>Rental term:</b> ${esc(r.rental_term_note)} ${button(r.rental_term_source,'Savannah STVR rules')}</p>`:''}<p><b>Address proof:</b><br>${r.address_correction_note?esc(r.address_correction_note):'User-confirmed photo match to the Realtor property. This is the research address, not an exact address disclosed by Airbnb.'}</p><div class="popup-actions">${button(r.realtor_url,'Supporting evidence 1 — Realtor listing')}${r.address_proof_url?button(r.address_proof_url,'Address correction — Zillow'):''}${r.photo_match_evidence?button(r.photo_match_evidence,'Supporting evidence 2 — Photo match'):''}${button(r.airbnb_url,'View listing')}</div><div class="popup-actions secondary-actions">${button(report(),'Report address info','secondary')}${button(report(r.matched_permits||''),'Report license info','secondary')}${button(dead,'Report dead listing','secondary')}${button(complaint,'Submit a complaint','secondary')}</div><small>${esc(r.classification_note)}</small></section>`;
}
async function main(){const response=await fetch('license_audit.json'),data=await response.json();const selected=document.body.dataset.category||'all';let records=data.records.filter(r=>selected==='all'||r.category===selected);document.getElementById('summary').textContent=`${records.length} user-confirmed listing/property associations · refreshed ${new Date(data.generated_unix*1000).toLocaleString()}`;
const links=r=>`<a href="${esc(r.airbnb_url)}" target="_blank" rel="noopener">Airbnb listing</a> · <a href="${esc(r.realtor_url)}" target="_blank" rel="noopener">Realtor listing</a>`;
function render(){const query=(document.getElementById('search')?.value||'').toLowerCase(),rows=records.filter(r=>(r.airbnb+' '+r.address+' '+r.jurisdiction).toLowerCase().includes(query));document.getElementById('rows').innerHTML=rows.map(r=>`<tr><td><a href="${esc(r.airbnb_url)}">${esc(r.airbnb)}</a><br>${esc(r.address)} ${esc(r.unit)}<br>${r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address'}</td><td>${esc(labels[r.category])}<br>${esc(r.jurisdiction)}</td><td>${esc(r.matched_permits||'No active record matched')}<br>${esc(r.source_status)}</td><td>${esc(r.license_display)}<br>${esc(r.displayed_numbers)}</td><td>${links(r)}<br>${esc(r.classification_note)}${r.rental_term_note?'<br>'+esc(r.rental_term_note):''}</td></tr>`).join('')}
render();if(document.getElementById('search'))document.getElementById('search').oninput=render;
if(document.getElementById('map'))await renderMap(records);
}

async function renderMap(listings){
 const map=L.map('map',{preferCanvas:true}).setView([32.03,-81.1],11);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
 const overlays={}, markers=[];
 const group=name=>overlays[name]??=(L.layerGroup().addTo(map));
 const link=(url,label)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(label)+'</a>';
 const key=(street,unit)=>JSON.stringify([street,unit||'']);
 const licensed=r=>['licensed','source_listed'].includes(r.license_state);
 const arcLicensed=r=>!!r.permit&&/(^|;\s*)Licensed STR($|;)/i.test(r.status);
 const green='#168047',yellow='#ffd54d',purple='#7950a5';
 function point(row,layer,content,ring,fill,radius){
  if(row.latitude==null||row.longitude==null||row.latitude===''||row.longitude==='')return;
  const coords=[Number(row.latitude),Number(row.longitude)];
  if(!coords.every(Number.isFinite))return;
  const marker=L.circleMarker(coords,{radius,color:ring,weight:2.5,fillColor:fill,fillOpacity:.9}).addTo(layer);
  const entry={marker,layer,content,radius};
  markers.push(entry);
  marker.on('click',()=>{
   const center=map.latLngToLayerPoint(marker.getLatLng());
   const neighbors=markers.filter(other=>other!==entry&&map.hasLayer(other.layer)&&
    center.distanceTo(map.latLngToLayerPoint(other.marker.getLatLng()))<=radius+other.radius);
   const nearby=neighbors.map(other=>'<details><summary>'+esc(other.content.title)+'</summary>'+other.content.html+'</details>').join('');
   L.popup({maxWidth:460,maxHeight:560}).setLatLng(marker.getLatLng())
    .setContent(content.html+(nearby?'<hr><h4>Other markers here</h4>'+nearby:'')).openOn(map);
  });
 }
 const [registry,sources,boundaries]=await Promise.all(['registry/licensed_locations.json','map_sources.json','municipalities.geojson'].map(async path=>{
  const response=await fetch(path);if(!response.ok)throw Error('Map source unavailable: '+path);return response.json();
 }));
 const registryByAddress=new Map();
 for(const row of registry.records){
  const k=key(row.normalized_address,row.unit);
  if(!registryByAddress.has(k))registryByAddress.set(k,[]);
  registryByAddress.get(k).push(row);
 }
 const arcByAddress=new Map(sources.county_arcgis.map(row=>[key(row.street,row.unit),row]));
 const flags=new Map(sources.county_likely_unlicensed.map(row=>[row.airbnb,row]));
 const registryInfo=rows=>rows.length?'<h4>License lists</h4><ul>'+rows.map(row=>
  '<li>'+esc(row.jurisdiction)+' · '+esc(licensed(row)?'Listed as licensed':row.license_state==='expired_in_source'?'Expired in source':'Source status requires review')+
  ' · '+esc(row.permit||'permit number not supplied')+(row.expiration?' · expires '+esc(row.expiration):'')+
  '<br>'+esc(row.status)+' · '+esc(row.source_file)+'</li>').join('')+'</ul>':'';
 const arcInfo=row=>row?'<h4>Chatham County ArcGIS</h4><ul>'+row.records.map(r=>
  '<li>'+esc(r.status||'Status not supplied')+(r.permit?' · '+esc(r.permit):'')+' · '+link(r.source_url,'Layer '+r.layer)+'</li>').join('')+'</ul>':'';
 const flagInfo=row=>row?'<p><b>Chatham County likely-unlicensed listings:</b> This Airbnb appears on the '+link(row.source_url,'source list')+'.</p>':'';
 const represented=new Set();
 for(const row of listings){
  const k=key(row.normalized_address,row.unit),arc=arcByAddress.get(k);
  const licenseRows=(registryByAddress.get(k)||[]).filter(r=>r.jurisdiction===row.jurisdiction);
  const isLicensed=licenseRows.some(licensed)||Boolean(row.matched_permits)||Boolean(row.jurisdiction==='UNINCORPORATED'&&arc?.records.some(arcLicensed));
  const fill=row.license_display==='not_shown_in_saved_text'?yellow:colors[row.category];
  point(row,group('Photo-verified Airbnb matches'),{title:'Airbnb '+row.airbnb+' · '+row.address,
   html:popupContent(row)+flagInfo(flags.get(row.airbnb))+arcInfo(arc)+registryInfo(licenseRows)},isLicensed?green:colors[row.category],fill,8);
  if(row.latitude!==''&&row.longitude!=='')represented.add(row.airbnb);
 }
 const registryGroups=new Map();
 for(const row of registry.records){
  if(row.map_status!=='mapped')continue;
  const k=JSON.stringify([row.jurisdiction,row.normalized_address,row.unit,row.latitude,row.longitude]);
  if(!registryGroups.has(k))registryGroups.set(k,[]);
  registryGroups.get(k).push(row);
 }
 const registryPositions=new Set();
 for(const rows of registryGroups.values()){
  const row=rows[0],k=key(row.normalized_address,row.unit),arc=row.jurisdiction==='UNINCORPORATED'?arcByAddress.get(k):null;
  if(arc)registryPositions.add(k);
  const title=row.normalized_address+(row.unit?' · '+row.unit:'');
  const jurisdiction=row.jurisdiction==='UNINCORPORATED'?'Chatham County':row.jurisdiction;
  const isLicensed=rows.some(licensed)||Boolean(arc?.records.some(arcLicensed));
  point(row,group('License list · '+jurisdiction),{title,html:'<h3>'+esc(title)+'</h3><p>Mapped jurisdiction: '+esc(row.actual_jurisdiction||'Unknown')+'</p>'+registryInfo(rows)+arcInfo(arc)+
   '<p>'+esc(row.match_note)+'</p>'+link('registry/index.html','License lists and CSVs')},isLicensed?green:purple,'#fff',5);
 }
 for(const row of sources.county_arcgis){
  const k=key(row.street,row.unit);
  if(registryPositions.has(k))continue;
  const title=row.street+(row.unit?' · '+row.unit:'');
  point(row,group('Additional Chatham County ArcGIS points'),{title,html:'<h3>'+esc(title)+'</h3>'+arcInfo(row)},
   row.records.some(arcLicensed)?green:purple,'#fff',5);
 }
 for(const row of sources.county_likely_unlicensed){
  if(represented.has(row.airbnb))continue;
  const title=row.address||'Airbnb '+row.airbnb,k=key(row.street,row.unit),arc=arcByAddress.get(k);
  const rows=(registryByAddress.get(k)||[]).filter(r=>r.jurisdiction==='UNINCORPORATED');
  const isLicensed=rows.some(licensed)||Boolean(arc?.records.some(arcLicensed));
  point(row,group('Chatham County likely-unlicensed list'),{title,html:'<h3>'+esc(title)+'</h3>'+
   '<p>Approximate listing point · '+esc(row.jurisdiction||'Jurisdiction unknown')+'</p>'+flagInfo(row)+arcInfo(arc)+registryInfo(rows)+
   link('https://www.airbnb.com/rooms/'+row.airbnb,'Airbnb listing')},isLicensed?green:purple,'#e1c9ff',6);
 }
 const palette={'SAVANNAH':'#245cb0','THUNDERBOLT':'#188353','TYBEE ISLAND':'#9645a5','UNINCORPORATED':'#6e654e',
  'POOLER':'#b64624','GARDEN CITY':'#96710e','PORT WENTWORTH':'#0b7f8e','BLOOMINGDALE':'#a04060','VERNONBURG':'#4853a3'};
 map.createPane('jurisdiction-boundaries');
 map.getPane('jurisdiction-boundaries').style.zIndex=350;
 map.getPane('jurisdiction-boundaries').style.pointerEvents='none';
 const outlines=L.geoJSON(boundaries,{pane:'jurisdiction-boundaries',interactive:false,
  style:feature=>({color:palette[feature.properties.NAME]||'#687280',weight:2,opacity:.8,fillOpacity:.09})}).addTo(map);
 overlays['Jurisdiction boundaries (SAGIS)']=outlines;
 L.control.layers(null,overlays,{collapsed:true}).addTo(map);
 const legend=L.control({position:'bottomleft'});
 legend.onAdd=()=>{
  const box=L.DomUtil.create('div','map-legend');
  box.innerHTML='<div><span style="border-color:'+green+'"></span> Listed as licensed</div>'+
   '<div><span style="background:'+yellow+'"></span> License absent from saved Airbnb text</div>'+
   '<div><span style="background:#e1c9ff"></span> Chatham County likely-unlicensed list</div>'+
   '<details><summary>Jurisdiction colors</summary>'+Object.entries(palette).map(([name,color])=>
    '<div><span style="border-color:'+color+';border-radius:2px"></span> '+esc(name)+'</div>').join('')+'</details>';
  L.DomEvent.disableClickPropagation(box);
  return box;
 };
 legend.addTo(map);
}

main().catch(e=>document.getElementById('summary').textContent=e.message);
