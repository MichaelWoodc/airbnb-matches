const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={license_not_shown:'Licensed address — license not shown',unlicensed:'Potentially unlicensed — no license record found',review:'License status unresolved',outside_scope:'License list unavailable',license_shown:'License shown'},colors={license_not_shown:'#087e8b',unlicensed:'#c32d40',review:'#b88213',outside_scope:'#77818c',license_shown:'#3869af'};
const midTermLabel='Mid-term rental · conditional STVR exemption';
const midTermColor='#7939a8';
const listingStatus=r=>r.rental_term_note?midTermLabel:labels[r.category];
function popupContent(r){
 const value=x=>x===undefined||x===null||x===''?'Not recorded':esc(x);
 const reportBase='https://docs.google.com/forms/d/e/1FAIpQLSf0UzTMk7k2NIsRYuNL54MmFjRmVHlXTXGVMsBnyUZYjNoJzA/viewform';
 const report=(license='')=>reportBase+'?'+new URLSearchParams({usp:'pp_url','entry.1013247072':r.airbnb_url,'entry.1545663527':r.address,'entry.1993836701':license});
 const dead='https://docs.google.com/forms/d/e/1FAIpQLSfdo8vwaQGlBQY8P_gHeZVdnGilHoVvnaqqDawClCIzfo7FDQ/viewform?'+new URLSearchParams({usp:'pp_url','entry.84751625':r.airbnb_url});
 const complaint='https://stvr-doorman.github.io/chatham_county_stvr_map/complaint_intro.html?'+new URLSearchParams({address:r.address,unit:r.unit||'',municipality:r.jurisdiction,host_name:r.host_name||'',url:r.airbnb_url,rental_type:r.rental_type||'',lat:r.latitude,lng:r.longitude});
 const button=(url,label,extra='')=>'<a class="popup-action '+extra+'" target="_blank" rel="noopener" href="'+esc(url)+'">'+esc(label)+'</a>';
 const addressLabel=r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address';
 const status=listingStatus(r);
 return `<section class="listing-popup"><h3>${esc(r.listing_title||'Airbnb '+r.airbnb)}</h3><div>${value(r.rental_type)}</div><p><b>${addressLabel}:</b> ${esc(r.address)} ${esc(r.unit)}<br><b>Host:</b> ${value(r.host_name)}<br><b>Advertised capacity:</b> ${value(r.advertised_capacity)}<br><b>Bedrooms:</b> ${value(r.bedrooms)}<br><b>Legal limit:</b> ${r.legal_limit?esc(r.legal_limit)+' (license record)':'Not established'}</p><p class="popup-status" style="border-color:${r.rental_term_note?midTermColor:colors[r.category]}">${esc(status)}${r.reported_on?' · Reported':''}${r.removed_on?' · Removed':''}</p>${r.removed_on?`<p><b>Removed:</b> Listing reported removed from Airbnb (${esc(r.removed_on)}).</p>`:''}${r.reported_on?`<p><b>Reported:</b> Complaint submitted, per reviewer (${esc(r.reported_on)}).</p>`:''}<p><b>Licensing jurisdiction:</b> ${esc(r.jurisdiction)}<br>${esc(r.category==='outside_scope'?'No local license list in this audit':r.matched_permits||((r.licensed_exact_unit||r.licensed_parcel_association)?'Listed as licensed · permit number not supplied':'No matching active license record'))}</p>${r.rental_term_note?`<p><b>Rental term:</b> ${esc(r.rental_term_note)} ${button(r.rental_term_source,'Savannah STVR rules')}</p>`:''}${r.license_unit_evidence?`<p><b>Licensed unit:</b> ${esc(r.license_unit_evidence)} ${button(r.license_unit_source,'Rental operator listing')}</p>`:''}${r.licensed_parcel_association?`<p><b>License basis:</b> ${esc(r.license_match_basis)}. Presumed parcel-level coverage.</p>`:''}<p><b>Address proof:</b><br>${r.address_correction_note?esc(r.address_correction_note):'User-confirmed photo match to the Realtor property. This is the research address, not an exact address disclosed by Airbnb.'}</p><div class="popup-actions">${button(r.realtor_url,'Supporting evidence 1 — Realtor listing')}${r.address_proof_url?button(r.address_proof_url,'Address correction — Zillow'):''}${r.photo_match_evidence?button(r.photo_match_evidence,'Supporting evidence 2 — Photo match'):''}${button(r.airbnb_url,'View listing')}</div><div class="popup-actions secondary-actions">${button(report(),'Report address info','secondary')}${button(report(r.matched_permits||''),'Report license info','secondary')}${button(dead,'Report dead listing','secondary')}${button(complaint,'Submit a complaint','secondary')}</div>${r.rental_term_note?'':`<small>${esc(r.classification_note)}</small>`}</section>`;
}
async function main(){const response=await fetch('license_audit.json'),data=await response.json();const selected=document.body.dataset.category||'all';let records=data.records.filter(r=>selected==='all'||r.category===selected);document.getElementById('summary').textContent=`${records.length} user-confirmed listing/property associations · refreshed ${new Date(data.generated_unix*1000).toLocaleString()}`;
const links=r=>`<a href="${esc(r.airbnb_url)}" target="_blank" rel="noopener">Airbnb listing</a> · <a href="${esc(r.realtor_url)}" target="_blank" rel="noopener">Realtor listing</a>`;
function render(){const query=(document.getElementById('search')?.value||'').toLowerCase(),rows=records.filter(r=>(r.airbnb+' '+r.address+' '+r.jurisdiction).toLowerCase().includes(query));document.getElementById('rows').innerHTML=rows.map(r=>`<tr><td><a href="${esc(r.airbnb_url)}">${esc(r.airbnb)}</a><br>${esc(r.address)} ${esc(r.unit)}<br>${r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address'}</td><td>${esc(listingStatus(r))}<br>${esc(r.jurisdiction)}</td><td>${esc(r.matched_permits||'No active record matched')}<br>${esc(r.source_status)}</td><td>${esc(r.license_display)}<br>${esc(r.displayed_numbers)}</td><td>${links(r)}<br>${esc(r.classification_note)}${r.rental_term_note?'<br>'+esc(r.rental_term_note):''}</td></tr>`).join('')}
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
 function point(row,layer,content,ring,fill,radius,triangle=false){
  if(row.latitude==null||row.longitude==null||row.latitude===''||row.longitude==='')return;
  const coords=[Number(row.latitude),Number(row.longitude)];
  if(!coords.every(Number.isFinite))return;
  const removed=Boolean(row.removed_on),reported=Boolean(row.reported_on);
  const iconShape=triangle
   ?`<path d="M11 2 L20 19 H2 Z" fill="${midTermColor}" stroke="${ring}" stroke-width="2"/>`
   :`<circle cx="11" cy="11" r="8" fill="${fill}" stroke="${ring}" stroke-width="2.5"/>`;
  const slashPath=removed?'M5 5 L17 17 M17 5 L5 17':reported?'M4 4 L18 18':'';
  const slash=slashPath?`<path d="${slashPath}" stroke="#fff" stroke-width="5"/><path d="${slashPath}" stroke="#c81724" stroke-width="3.2"/>`:'';
  const marker=(triangle||reported||removed?L.marker(coords,{title:content.title,icon:L.divIcon({
   className:removed?'removed-marker':reported?'reported-marker':'mid-term-marker',iconSize:[22,22],iconAnchor:[11,11],
   html:`<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">${iconShape}${slash}</svg>`
  })}):L.circleMarker(coords,{radius,color:ring,weight:2.5,fillColor:fill,fillOpacity:.9})).addTo(layer);
  const entry={marker,layer,content,radius};
  markers.push(entry);
  marker.on('click',()=>{
   const center=map.latLngToLayerPoint(marker.getLatLng());
   const neighbors=markers.filter(other=>other!==entry&&map.hasLayer(other.layer)&&
    center.distanceTo(map.latLngToLayerPoint(other.marker.getLatLng()))<=radius+other.radius);
   const nearby=neighbors.map(other=>'<details><summary>'+esc(other.content.title)+'</summary>'+other.content.html+'</details>').join('');
   L.popup({maxWidth:460,maxHeight:300}).setLatLng(marker.getLatLng())
    .setContent(content.html+(nearby?'<hr><h4>Other markers here</h4>'+nearby:'')).openOn(map);
  });
 }
 const [registry,sources,boundaries,parcels]=await Promise.all(['registry/licensed_locations.json','map_sources.json','municipalities.geojson','licensed_parcels.geojson'].map(async path=>{
  const response=await fetch(path);if(!response.ok)throw Error('Map source unavailable: '+path);return response.json();
 }));
 const registryById=new Map(registry.records.map(row=>[row.source_id,row]));
 const registryByAddress=new Map();
 for(const row of registry.records){
  const k=key(row.normalized_address,row.unit);
  if(!registryByAddress.has(k))registryByAddress.set(k,[]);
  registryByAddress.get(k).push(row);
 }
 const arcByAddress=new Map(sources.county_arcgis.map(row=>[key(row.street,row.unit),row]));
 const flags=new Map(sources.county_likely_unlicensed.map(row=>[row.airbnb,row]));
 function registryInfo(rows){
  if(!rows.length)return '';
  const entries=new Map();
  for(const row of rows){
   const key=JSON.stringify([row.jurisdiction,row.permit,row.expiration,row.status,row.license_state,row.source_file]);
   if(!entries.has(key))entries.set(key,{row,count:0});
   entries.get(key).count++;
  }
  return '<h4>License lists</h4><ul>'+Array.from(entries.values(),({row,count})=>
   '<li>'+esc(row.jurisdiction)+' · '+esc(licensed(row)?'Listed as licensed':row.license_state==='expired_in_source'?'Expired in source':'Source status requires review')+
   ' · '+esc(row.permit||'permit number not supplied')+(row.expiration?' · expires '+esc(row.expiration):'')+
   '<br>'+esc(row.source_file)+(count>1?' · '+count+' source rows with the same listed details':'')+'</li>').join('')+'</ul>';
 }
 const arcInfo=row=>row?'<h4>Chatham County ArcGIS</h4><ul>'+row.records.map(r=>
  '<li>'+esc(r.status||'Status not supplied')+(r.permit?' · '+esc(r.permit):'')+' · '+link(r.source_url,'Layer '+r.layer)+'</li>').join('')+'</ul>':'';
 const flagInfo=row=>row?'<p><b>Chatham County likely-unlicensed listings:</b> This Airbnb appears on the '+link(row.source_url,'source list')+'.</p>':'';
 const represented=new Set();
 for(const row of listings){
  const k=key(row.normalized_address,row.unit),arc=arcByAddress.get(k);
  const licenseRows=(registryByAddress.get(k)||[]).filter(r=>r.jurisdiction===row.jurisdiction);
  const isLicensed=licenseRows.some(licensed)||Boolean(row.licensed_exact_unit||row.licensed_parcel_association)||Boolean(row.jurisdiction==='UNINCORPORATED'&&arc?.records.some(arcLicensed));
  const fill=row.license_display==='not_shown_in_saved_text'?yellow:colors[row.category];
  const midTerm=Boolean(row.rental_term_note);
  point(row,group(midTerm?'Reported mid-term rentals':'Photo-verified Airbnb matches'),{title:'Airbnb '+row.airbnb+' · '+row.address,
   html:popupContent(row)+flagInfo(flags.get(row.airbnb))+arcInfo(arc)+registryInfo(licenseRows)},isLicensed?green:midTerm?'#4a2069':colors[row.category],fill,8,midTerm);
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
 const outlines=L.geoJSON(boundaries,{pane:'jurisdiction-boundaries',renderer:L.svg({pane:'jurisdiction-boundaries'}),interactive:false,
  style:feature=>({color:palette[feature.properties.NAME]||'#687280',weight:2,opacity:.8,fillOpacity:.09})}).addTo(map);
 overlays['Jurisdiction boundaries (SAGIS)']=outlines;
 map.createPane('licensed-parcels');
 map.getPane('licensed-parcels').style.zIndex=370;
 const parcelRenderer=L.canvas({pane:'licensed-parcels'});
 overlays['Licensed parcels (green fill)']=L.geoJSON(parcels,{pane:'licensed-parcels',renderer:parcelRenderer,
  style:{color:'#08713b',weight:1.4,opacity:.85,fillColor:'#28a856',fillOpacity:.3},
  onEachFeature:(feature,layer)=>{
   const records=feature.properties.license_source_ids.map(id=>registryById.get(id)).filter(Boolean);
   const addresses=[...new Set(records.map(row=>row.normalized_address))];
   layer.bindPopup('<h3>'+esc(addresses.join(' / ')||'Licensed parcel')+'</h3><p>SAGIS parcel '+esc(feature.properties.pin)+
    '</p>'+registryInfo(records),{maxWidth:420,maxHeight:300});
  }}).addTo(map);
 L.control.layers(null,overlays,{collapsed:true}).addTo(map);
 const legend=L.control({position:'bottomleft'});
 legend.onAdd=()=>{
  const box=L.DomUtil.create('div','map-legend');
  box.innerHTML='<div><span style="background:#a3dbb1;border-color:#08713b;border-radius:2px"></span> Licensed parcel</div>'+
   '<div><span class="reported-legend"></span> Complaint reported</div>'+
   '<div><span class="removed-legend"></span> Listing reported removed</div>'+
   '<div><span style="border-color:'+green+'"></span> Listed as licensed</div>'+
   '<div><span style="background:'+yellow+'"></span> License absent from saved Airbnb text</div>'+
   '<div><span class="mid-term-legend"></span> '+esc(midTermLabel)+'</div>'+
   '<div><span style="background:#e1c9ff"></span> Chatham County likely-unlicensed list</div>'+
   '<details><summary>Jurisdiction colors</summary>'+Object.entries(palette).map(([name,color])=>
    '<div><span style="border-color:'+color+';border-radius:2px"></span> '+esc(name)+'</div>').join('')+'</details>';
  L.DomEvent.disableClickPropagation(box);
  return box;
 };
 legend.addTo(map);
}

main().catch(e=>document.getElementById('summary').textContent=e.message);
