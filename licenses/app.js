const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={license_not_shown:'Licensed address — license not shown',unlicensed:'Potentially unlicensed — no license record found',review:'License status unresolved',outside_scope:'License list unavailable',license_shown:'License shown'},colors={license_not_shown:'#087e8b',unlicensed:'#c32d40',review:'#b88213',outside_scope:'#77818c',license_shown:'#3869af'};
const midTermLabel='Mid-term rental · conditional STVR exemption';
const midTermColor='#7939a8';
const listingStatus=r=>r.rental_term_note?midTermLabel:r.license_marker_status||labels[r.category];
const privacyRadiusText=radius=>!Number.isFinite(radius)?'Unavailable':
 radius===0?'0 m (Airbnb marks this location as exact)':radius+' m';
const privacyRadiusField=radius=>'<b>Airbnb privacy radius:</b> '+esc(privacyRadiusText(radius));
function popupContent(r){
 const value=x=>x===undefined||x===null||x===''?'Not recorded':esc(x);
 const reportBase='https://docs.google.com/forms/d/e/1FAIpQLSf0UzTMk7k2NIsRYuNL54MmFjRmVHlXTXGVMsBnyUZYjNoJzA/viewform';
 const report=(license='')=>reportBase+'?'+new URLSearchParams({usp:'pp_url','entry.1013247072':r.airbnb_url,'entry.1545663527':r.address,'entry.1993836701':license});
 const dead='https://docs.google.com/forms/d/e/1FAIpQLSfdo8vwaQGlBQY8P_gHeZVdnGilHoVvnaqqDawClCIzfo7FDQ/viewform?'+new URLSearchParams({usp:'pp_url','entry.84751625':r.airbnb_url});
 const complaint='https://stvr-doorman.github.io/chatham_county_stvr_map/complaint_intro.html?'+new URLSearchParams({address:r.address,unit:r.unit||'',municipality:r.jurisdiction,host_name:r.host_name||'',url:r.airbnb_url,rental_type:r.rental_type||'',lat:r.latitude,lng:r.longitude});
 const button=(url,label,extra='')=>'<a class="popup-action '+extra+'" target="_blank" rel="noopener" href="'+esc(url)+'">'+esc(label)+'</a>';
 const addressLabel=r.address_label||(r.address_only?'User-corrected address':r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address');
 const status=listingStatus(r);
 const capacity=r.advertised_over_capacity>0?`<p><b>Advertised over listed capacity by ${esc(r.advertised_over_capacity)}</b><br>Airbnb advertises ${esc(r.advertised_capacity)} guests. ${r.combined_license_capacity?`The unit permits list ${esc(r.combined_license_capacity)} combined.<br>${r.capacity_permits.map(p=>`Unit ${esc(p.unit)} · ${esc(p.permit)} · ${esc(p.capacity)}`).join('<br>')}`:`The permit limit is ${esc(r.legal_limit)} guests.`}</p>`:'';

 return `<section class="listing-popup"><h3>${esc(r.listing_title||'Airbnb '+r.airbnb)}</h3><div>${value(r.rental_type)}</div><p><b>${addressLabel}:</b> ${esc(r.address)} ${esc(r.unit)}<br><b>Host:</b> ${value(r.host_name)}<br><b>Advertised capacity:</b> ${value(r.advertised_capacity)}<br><b>Bedrooms:</b> ${value(r.bedrooms)}<br>${privacyRadiusField(r.privacy_radius_meters)}<br><b>Legal limit:</b> ${r.legal_limit?esc(r.legal_limit)+' (license record)':'Not established'}</p><p class="popup-status" style="border-color:${r.rental_term_note?midTermColor:colors[r.category]}">${esc(status)}${r.reported_on?' · Reported':''}${r.removed_on||r.removed_reason?' · Removed':''}</p>${capacity}${r.removed_reason?`<p><b>☠️ Removed:</b> ${esc(r.removed_reason)}</p>`:r.removed_on?`<p><b>Removed:</b> Listing reported removed from Airbnb (${esc(r.removed_on)}).</p>`:''}${r.reported_on?`<p><b>Reported:</b> ${esc(r.report_note||'Complaint submitted, per reviewer')} (${esc(r.reported_on)}).</p>`:''}<p><b>Licensing jurisdiction:</b> ${esc(r.jurisdiction)}<br>${esc(r.category==='outside_scope'?'No local license list in this audit':r.matched_permits||((r.licensed_exact_unit||r.licensed_parcel_association)?'Listed as licensed · permit number not supplied':'No matching active license record'))}</p>${r.rental_term_note?`<p><b>Rental term:</b> ${esc(r.rental_term_note)} ${button(r.rental_term_source,'Savannah STVR rules')}</p>`:''}${r.license_unit_evidence?`<p><b>Licensed unit:</b> ${esc(r.license_unit_evidence)} ${button(r.license_unit_source,r.license_unit_source_label||'Rental operator listing')}</p>`:''}${r.parcel_license_note?`<p><b>Permit scope:</b> ${esc(r.parcel_license_note)}</p>`:''}${r.licensed_parcel_association?`<p><b>License basis:</b> ${esc(r.license_match_basis)}. Presumed parcel-level coverage.</p>`:''}<p><b>Address proof:</b><br>${r.address_correction_note?esc(r.address_correction_note):'User-confirmed photo match to the Realtor property. This is the research address, not an exact address disclosed by Airbnb.'}</p><div class="popup-actions">${r.realtor_url?button(r.realtor_url,r.address_only?'Realtor property listing':'Supporting evidence 1 — Realtor listing'):''}${r.address_proof_url?button(r.address_proof_url,r.address_only?'Address evidence — Google Maps':'Address correction — Zillow'):''}${r.photo_match_evidence?button(r.photo_match_evidence,'Supporting evidence 2 — Photo match'):''}${r.report_pdf?button(r.report_pdf,r.report_receipt_only?'View submission receipt (PDF)':'View complaint and receipt (PDF)'):''}${button(r.airbnb_url,'View listing')}</div><div class="popup-actions secondary-actions">${button(report(),'Report address info','secondary')}${button(report(r.matched_permits||''),'Report license info','secondary')}${button(dead,'Report dead listing','secondary')}${button(complaint,'Submit a complaint','secondary')}</div>${r.rental_term_note?'':`<small>${esc(r.classification_note)}</small>`}</section>`;
}
async function main(){const response=await fetch('license_audit.json'),data=await response.json();const selected=document.body.dataset.category||'all';let records=data.records.filter(r=>selected==='all'||r.category===selected);document.getElementById('summary').textContent=`${records.length} user-confirmed listing/property associations · refreshed ${new Date(data.generated_unix*1000).toLocaleString()}`;
const links=r=>`<a href="${esc(r.airbnb_url)}" target="_blank" rel="noopener">Airbnb listing</a> · <a href="${esc(r.realtor_url)}" target="_blank" rel="noopener">Realtor listing</a>`;
function render(){const query=(document.getElementById('search')?.value||'').toLowerCase(),rows=records.filter(r=>(r.airbnb+' '+r.address+' '+r.jurisdiction).toLowerCase().includes(query));document.getElementById('rows').innerHTML=rows.map(r=>`<tr><td><a href="${esc(r.airbnb_url)}">${esc(r.airbnb)}</a><br>${esc(r.address)} ${esc(r.unit)}<br>${r.address_only?'User-corrected address':r.conflicting_property_matches?'Conflicting verified address matches':'Photo-verified address'}</td><td>${esc(listingStatus(r))}<br>${esc(r.jurisdiction)}</td><td>${esc(r.matched_permits||'No active record matched')}<br>${esc(r.source_status)}</td><td>${esc(r.license_display)}<br>${esc(r.displayed_numbers)}</td><td>${links(r)}<br>${esc(r.classification_note)}${r.rental_term_note?'<br>'+esc(r.rental_term_note):''}</td></tr>`).join('')}
render();if(document.getElementById('search'))document.getElementById('search').oninput=render;
if(document.getElementById('map')){
 const rejected=await renderMap(records);
 records=records.filter(row=>!rejected.has(row));
 document.getElementById('summary').textContent=`${records.length} listing/property associations · refreshed ${new Date(data.generated_unix*1000).toLocaleString()}`;
 render();
}
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
 const mapElement=map.getContainer();
 const popupPadding=12;
 function visibleMapBounds(){
  const bounds=mapElement.getBoundingClientRect();
  return {
   left:Math.max(0,bounds.left),top:Math.max(0,bounds.top),
   right:Math.min(document.documentElement.clientWidth,bounds.right),
   bottom:Math.min(document.documentElement.clientHeight,bounds.bottom)
  };
 }
 const popupOptions=()=> {
  const bounds=visibleMapBounds();
  return {minWidth:0,maxWidth:Math.max(40,Math.min(460,bounds.right-bounds.left-72)),
   maxHeight:Math.max(40,Math.min(300,bounds.bottom-bounds.top-72)),autoPan:false};
 };
 let openPopup=null;
 let fittingPopup=false;
 map.on('popupopen',({popup})=>{
  openPopup=popup;
  fittingPopup=true;
  let bounds=visibleMapBounds();
  if(bounds.bottom-bounds.top<160){
   mapElement.scrollIntoView({block:'center',inline:'nearest'});
   bounds=visibleMapBounds();
  }
  L.setOptions(popup,popupOptions());
  popup.update();
  const card=popup.getElement().getBoundingClientRect();
  const shift=(start,end,min,max)=>start<min?start-min:end>max?end-max:0;
  const dx=shift(card.left,card.right,bounds.left+popupPadding,bounds.right-popupPadding);
  const dy=shift(card.top,card.bottom,bounds.top+popupPadding,bounds.bottom-popupPadding);
  if(dx||dy)map.panBy([dx,dy],{animate:false});
  fittingPopup=false;
 });
 map.on('popupclose',({popup})=>{
  if(openPopup===popup)openPopup=null;
 });
 map.on('moveend',()=>{
  const popup=openPopup;
  if(!popup||fittingPopup)return;
  requestAnimationFrame(()=>{
   if(openPopup!==popup)return;
   const card=popup.getElement().getBoundingClientRect();
   const bounds=visibleMapBounds();
   if(card.right<=bounds.left||card.left>=bounds.right||card.bottom<=bounds.top||card.top>=bounds.bottom)
    map.closePopup(popup);
  });
 });
 const green='#168047',yellow='#ffd54d',purple='#7950a5';
 const reportSlash='<path d="M4 4 L18 18" stroke="#c81724" stroke-width="3.2"/>';
 const renderMarker=content=>`<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">${content}</svg>`;
 const skullIcon=()=>L.divIcon({className:'removed-marker',iconSize:[22,22],iconAnchor:[11,11],html:'<span style="display:block;font-size:16px;line-height:22px;text-align:center">☠️</span>'});
 function point(row,layer,content,ring,fill,radius,triangle=false){
  if(row.latitude==null||row.longitude==null||row.latitude===''||row.longitude==='')return;
  const coords=[Number(row.latitude),Number(row.longitude)];
  if(!coords.every(Number.isFinite))return;
  const removed=Boolean(row.removed_on||row.removed_reason),reported=Boolean(row.reported_on);
  const over=Number(row.advertised_over_capacity)||0;
  const iconShape=over>0
   ?`<circle cx="11" cy="11" r="9" fill="#c81724" stroke="#8d111b" stroke-width="2"/><text x="11" y="15" text-anchor="middle" fill="#fff" font-size="13" font-weight="bold">${over}</text>`
   :triangle
   ?`<path d="M11 2 L20 19 H2 Z" fill="${midTermColor}" stroke="${ring}" stroke-width="2"/>`
   :`<circle cx="11" cy="11" r="8" fill="${fill}" stroke="${ring}" stroke-width="2.5"/>`;
  const slash=reported?reportSlash:'';
  const marker=(triangle||reported||removed||over>0?L.marker(coords,{title:content.title,icon:removed&&!reported?skullIcon():L.divIcon({
   className:removed?'removed-marker':over>0?'over-capacity-marker':reported?'reported-marker':'mid-term-marker',
   iconSize:[22,22],iconAnchor:[11,11],
   html:renderMarker(removed?'<text x="11" y="17" text-anchor="middle" font-size="16">☠️</text>'+slash:
    over>0&&reported?'<circle cx="11" cy="11" r="9" fill="#fff" stroke="#c81724" stroke-width="2"/>'+slash+
     `<text x="11" y="15" text-anchor="middle" fill="#181818" font-size="13" font-weight="bold">${over}</text>`:
    iconShape+slash)
  })}):L.circleMarker(coords,{radius,color:ring,weight:2.5,fillColor:fill,fillOpacity:.9})).addTo(layer);
  const entry={marker,layer,content,radius};
  markers.push(entry);
  marker.on('click',()=>{
   const center=map.latLngToLayerPoint(marker.getLatLng());
   const neighbors=markers.filter(other=>other!==entry&&map.hasLayer(other.layer)&&
    center.distanceTo(map.latLngToLayerPoint(other.marker.getLatLng()))<=radius+other.radius);
   const nearby=neighbors.map(other=>'<details><summary>'+esc(other.content.title)+'</summary>'+other.content.html+'</details>').join('');
   L.popup(popupOptions()).setLatLng(marker.getLatLng())
    .setContent(content.html+(nearby?'<hr><h4>Other markers here</h4>'+nearby:'')).openOn(map);
  });
  return marker;
 }
 const [registry,sources,boundaries,parcels,outsideOverlay]=await Promise.all(['registry/licensed_locations.json','map_sources.json','municipalities.geojson','licensed_parcels.geojson','savannah_outside_stvr_overlay.geojson'].map(async path=>{
  const response=await fetch(path);if(!response.ok)throw Error('Map source unavailable: '+path);return response.json();
 }));
 const scrapes=sources.airbnb_scrapes?.listings||{};
 const propertyPoint=row=>row.latitude!==''&&row.longitude!==''&&
  row.latitude!=null&&row.longitude!=null&&[Number(row.latitude),Number(row.longitude)].every(Number.isFinite)
  ?[Number(row.latitude),Number(row.longitude)]:null;
 const outOfRange=(aid,property)=>{
  const record=scrapes[aid];
  return Boolean(property&&record?.center&&Number.isFinite(record.radius_meters)&&
   map.distance(record.center,property)>record.radius_meters+50);
 };
 const rejected=new Set(listings.filter(row=>outOfRange(row.airbnb,propertyPoint(row))));
 const rejectedIds=new Set([...rejected].map(row=>row.airbnb));
 listings=listings.filter(row=>!rejected.has(row))
  .map(row=>({...row,removed_reason:scrapes[row.airbnb]?.removed_reason,
   privacy_radius_meters:scrapes[row.airbnb]?.radius_meters}));
 const geometryLayer=L.layerGroup().addTo(map);
 const scrapeLayer=L.layerGroup();
 overlays['Airbnb centers, privacy circles and property links']=geometryLayer;
 overlays['Latest scrape · additional Airbnb centers']=scrapeLayer;
 const centerColor='#2269af',centerRenderer=L.canvas({padding:.25});
 const centerPane=map.createPane('airbnb-centers');
 centerPane.style.zIndex=625;
 const centerIcon=L.divIcon({className:'airbnb-center-marker',iconSize:[14,14],iconAnchor:[7,7],
  html:'<span style="display:block;width:10px;height:10px;margin:2px;box-sizing:border-box;border:2px solid #2269af;border-radius:50%;background:#fff"></span>'});
 const reportedIds=new Set(listings.filter(row=>row.reported_on).map(row=>row.airbnb));
 const reportedCenterIcon=L.divIcon({className:'airbnb-center-marker reported-marker',iconSize:[22,22],iconAnchor:[11,11],
  html:renderMarker('<circle cx="11" cy="11" r="5" fill="#fff" stroke="#2269af" stroke-width="2"/>'+reportSlash)});
 const approximateIds=new Set();
 const propertyMarkers=new Map();
 function geometry(aid,record,property,layer,permitContext=''){
  if(!record?.center)return;
  if(outOfRange(aid,property))property=null;
  const center=record.center;
  const radius=record.radius_meters;
  const companyLink=link('https://www.airbnb.com/rooms/'+aid,'Airbnb listing');
  const displayed=(record.displayed_numbers||[]).join(', ');
  const html='<h3>'+esc(record.title||'Airbnb '+aid)+'</h3><p>'+esc(record.center_source)+
   (record.removed_reason?'<br><b>☠️ Removed from Airbnb</b> · '+esc(record.removed_reason):'')+
   '<br>'+privacyRadiusField(radius)+(property?'<br>Distance to linked property: '+Math.round(map.distance(center,property))+' m':'')+
   (record.rental_type?'<br>'+esc(record.rental_type):'')+(record.bedrooms!=null?'<br>Bedrooms: '+esc(record.bedrooms):'')+
   (record.occupancy!=null?'<br>Advertised capacity: '+esc(record.occupancy):'')+
   (displayed?'<br>Displayed license numbers: '+esc(displayed):'')+'</p>'+permitContext+companyLink;
  if(radius>0&&!record.removed_reason)L.circle(center,{radius,color:centerColor,weight:1.25,opacity:.7,fillOpacity:.07,
   interactive:false,renderer:centerRenderer}).addTo(layer);
  if(property)L.polyline([center,property],{color:centerColor,dashArray:'5 5',weight:2,opacity:.9,
   interactive:false,renderer:centerRenderer}).addTo(layer);
  const marker=L.marker(center,{pane:'airbnb-centers',icon:record.removed_reason?skullIcon():reportedIds.has(aid)?reportedCenterIcon:centerIcon,
   title:(record.removed_reason?'Removed from Airbnb: ':'Airbnb location: ')+(record.title||aid)});
  marker.on('click',()=>{
   const linkedMarker=property&&propertyMarkers.get(aid);
   if(linkedMarker)linkedMarker.fire('click');
   else L.popup(popupOptions()).setLatLng(center).setContent(html).openOn(map);
  }).addTo(layer);
  approximateIds.add(aid);
  return marker;
 }
 const registryById=new Map(registry.records.map(row=>[row.source_id,row]));
 const registryByAddress=new Map(),registryByPermit=new Map();
 for(const row of registry.records){
  const k=key(row.normalized_address,row.unit);
  if(!registryByAddress.has(k))registryByAddress.set(k,[]);
  registryByAddress.get(k).push(row);
  if(row.permit){
   if(!registryByPermit.has(row.permit))registryByPermit.set(row.permit,[]);
   registryByPermit.get(row.permit).push(row);
  }
 }
 const arcByAddress=new Map(sources.county_arcgis.map(row=>[key(row.street,row.unit),row]));
 const flags=new Map(sources.county_likely_unlicensed.map(row=>[row.airbnb,row]));
 function registryInfo(rows){
  if(!rows.length)return '';
  const entries=new Map();
  for(const row of rows){
   const key=JSON.stringify([row.jurisdiction,row.unit,row.permit,row.expiration,row.status,row.license_state,row.source_file]);
   if(!entries.has(key))entries.set(key,{row,count:0});
   entries.get(key).count++;
  }
  return '<h4>License lists</h4><ul>'+Array.from(entries.values(),({row,count})=>
   '<li>'+esc(row.jurisdiction)+' · '+esc(licensed(row)?'Listed as licensed':row.license_state==='expired_in_source'?'Expired in source':'Source status requires review')+
   ' · '+esc(row.permit||'permit number not supplied')+(row.unit?' · unit '+esc(row.unit):'')+
  (row.approved_capacity?' · listed capacity '+esc(row.approved_capacity):'')+(row.expiration?' · expires '+esc(row.expiration):'')+
   '<br>'+esc(row.source_file)+(count>1?' · '+count+' source rows with the same listed details':'')+'</li>').join('')+'</ul>';
 }
 const arcInfo=row=>row?'<h4>Chatham County ArcGIS</h4><ul>'+row.records.map(r=>
  '<li>'+esc(r.status||'Status not supplied')+(r.permit?' · '+esc(r.permit):'')+' · '+link(r.source_url,'Layer '+r.layer)+'</li>').join('')+'</ul>':'';
 const flagInfo=row=>row?'<p><b>Chatham County likely-unlicensed listings:</b> This Airbnb appears on the '+link(row.source_url,'source list')+'.</p>':'';
 const represented=new Set(), mergedSourceIds=new Set(), mergedListings=new Map();
 const requestedListing=new URLSearchParams(location.search).get('airbnb');
 const alreadyLinked=new Set();
 let requestedPin=null;
 function listingMarker(row,content,isLicensed,groupName){
  const fill=isLicensed&&row.jurisdiction==='POOLER'?green:row.license_display==='not_shown_in_saved_text'?yellow:colors[row.category];
  const midTerm=Boolean(row.rental_term_note);
  const marker=point(row,group(groupName),content,isLicensed?green:midTerm?'#4a2069':colors[row.category],fill,8,midTerm);
  if(marker)propertyMarkers.set(row.airbnb,marker);
  if(row.airbnb===requestedListing&&marker)requestedPin=marker;
 }
 for(const row of listings){
  const k=key(row.normalized_address,row.unit),arc=arcByAddress.get(k);
  const permits=(row.matched_permits||'').split(' | ').filter(Boolean);
  const pins=(row.assessor_pin||'').split(' | ').filter(Boolean);
  const exactAddress=(registryByAddress.get(k)||[]).filter(r=>r.jurisdiction===row.jurisdiction);
  const permitRows=permits.flatMap(permit=>registryByPermit.get(permit)||[]).filter(r=>
   r.jurisdiction===row.jurisdiction&&licensed(r)&&
   (r.normalized_address===row.normalized_address||pins.includes(r.sagis_pin||r.parcel_pin))&&
   (!pins.length||!(r.sagis_pin||r.parcel_pin)||pins.includes(r.sagis_pin||r.parcel_pin)));
  const direct=!row.conflicting_property_matches&&row.licensed_exact_unit;
  const distinctPermits=[...new Set(permitRows.map(r=>r.permit))];
  // A single unit-specific permit on the verified parcel is useful address evidence.
  // Its coverage is only attributed to the unit named in the license record.
  const parcelOnly=!direct&&!row.conflicting_property_matches&&!row.unit&&row.category==='review'&&
   distinctPermits.length===1&&permitRows.every(r=>r.unit&&pins.includes(r.sagis_pin||r.parcel_pin)&&
    r.normalized_address===row.normalized_address);
  const candidateRows=direct?[...new Set([...exactAddress.filter(r=>licensed(r)&&(!permits.length||permits.includes(r.permit))&&
    (!pins.length||!(r.sagis_pin||r.parcel_pin)||pins.includes(r.sagis_pin||r.parcel_pin))),
    ...permitRows.filter(r=>r.unit===(row.unit||''))])]:parcelOnly?permitRows:exactAddress;
  const licenseRows=candidateRows.filter(r=>!outOfRange(row.airbnb,propertyPoint(r)));
  const canMerge=(direct||parcelOnly)&&licenseRows.length>0;
  const status=parcelOnly&&canMerge?'Licensed parcel · listing coverage unresolved':
   direct&&row.license_display==='unknown'?'Listed as licensed · listing display unknown':'';
  const scoped=parcelOnly&&canMerge?{
   ...row,license_marker_status:status,classification_note:'',
   parcel_license_note:`The permit on file covers the ${licenseRows[0].unit}.${licenseRows[0].approved_capacity?' Listed capacity: '+licenseRows[0].approved_capacity+'.':''} Coverage for this Airbnb listing is unresolved.`
  }:{...row,license_marker_status:status};
  const displayedMatch=row.numeric_license_matches?'<p>Displayed license matched to the property record: '+esc(row.numeric_license_matches)+'</p>':'';
  const content={title:'Airbnb '+row.airbnb+' · '+row.address,
   html:popupContent(scoped)+displayedMatch+flagInfo(flags.get(row.airbnb))+arcInfo(arc)+registryInfo(licenseRows)};
  if(canMerge){
   licenseRows.forEach(record=>mergedSourceIds.add(record.source_id));
   const special=row.reported_on||row.removed_on||row.removed_reason||row.rental_term_note||row.advertised_over_capacity>0;
   const mergeKey=JSON.stringify([licenseRows.map(r=>r.source_id).sort(),special?row.airbnb:null]);
   if(!mergedListings.has(mergeKey))mergedListings.set(mergeKey,[]);
   mergedListings.get(mergeKey).push({row,content,licenseRows});
  }else{
   const isLicensed=Boolean(row.licensed_exact_unit||row.licensed_parcel_association);
   if(!row.conflicting_property_matches){
    geometry(row.airbnb,scrapes[row.airbnb],propertyPoint(row),geometryLayer);
    alreadyLinked.add(row.airbnb);
   }
   listingMarker(row,content,isLicensed,row.rental_term_note?'Reported mid-term rentals':row.address_only?'Research address matches':'Photo-verified Airbnb matches');
  }
  if(row.latitude!==''&&row.longitude!=='')represented.add(row.airbnb);
 }
 for(const entries of mergedListings.values()){
  const chosen=entries.find(entry=>entry.row.airbnb===requestedListing)||entries[0];
  const other=entries.filter(entry=>entry!==chosen).map(entry=>'<details><summary>'+esc(entry.content.title)+'</summary>'+entry.content.html+'</details>').join('');
  const mapped=chosen.licenseRows.find(r=>r.map_status==='mapped');
  const row=mapped?{...chosen.row,latitude:mapped.latitude,longitude:mapped.longitude}:chosen.row;
  for(const entry of entries){
   const property=entry.licenseRows.find(r=>r.map_status==='mapped')||entry.row;
   geometry(entry.row.airbnb,scrapes[entry.row.airbnb],propertyPoint(property),geometryLayer);
   alreadyLinked.add(entry.row.airbnb);
  }
  listingMarker(row,{title:chosen.content.title,html:chosen.content.html+(other?'<hr><h4>Other listings at this licensed address</h4>'+other:'')},
   true,'Licensed Airbnb matches');
  if(propertyMarkers.has(chosen.row.airbnb))for(const entry of entries)propertyMarkers.set(entry.row.airbnb,propertyMarkers.get(chosen.row.airbnb));
 }
 for(const row of sources.manual_locations||[]){
  if(represented.has(row.airbnb)||rejectedIds.has(row.airbnb))continue;
  if(outOfRange(row.airbnb,propertyPoint(row))){
   rejectedIds.add(row.airbnb);
   continue;
  }
  geometry(row.airbnb,scrapes[row.airbnb],propertyPoint(row),geometryLayer);
  alreadyLinked.add(row.airbnb);
  const records=(registryByAddress.get(key(row.street,row.unit))||[]).filter(r=>r.jurisdiction===row.jurisdiction);
  const title='Airbnb '+row.airbnb+' · '+row.address;
  const current={...row,removed_reason:scrapes[row.airbnb]?.removed_reason,
   privacy_radius_meters:scrapes[row.airbnb]?.radius_meters};
  const marker=point(current,group('Research address matches'),{title,html:popupContent({
   ...current,listing_title:row.title,address_label:'Research address',category:'review',
   airbnb_url:'https://www.airbnb.com/rooms/'+row.airbnb,
   address_correction_note:'Mapped to SAGIS parcel '+row.parcel_pin+'.'
  })+registryInfo(records)},records.some(licensed)?green:'#255b93','#c9e3ff',8);
  if(marker)propertyMarkers.set(row.airbnb,marker);
  if(row.airbnb===requestedListing)requestedPin=marker;
 }
 const reviewedIds=new Set(listings.map(row=>row.airbnb));
 const countyFlagged=new Set(sources.county_likely_unlicensed.map(row=>row.airbnb));
 for(const [aid,record] of Object.entries(scrapes)){
  if(alreadyLinked.has(aid)||approximateIds.has(aid))continue;
  const permitIds=record.pooler_permits||[];
  const permitRows=permitIds.map(id=>registryById.get(id)).filter(r=>r&&!outOfRange(aid,propertyPoint(r)));
  if(record.removed_reason&&!permitRows.length){
   const marker=geometry(aid,record,null,group('Removed Airbnb listings'));
   if(aid===requestedListing&&marker&&!requestedPin)requestedPin=marker;
  }else if(!reviewedIds.has(aid)&&!rejectedIds.has(aid)&&permitRows.length===1){
   const permit=permitRows[0],property=propertyPoint(permit);
   const title=(record.title||'Airbnb '+aid)+' · '+permit.address;
   const permitContext='<p>Linked by displayed permit number to '+esc(permit.address)+'.</p>'+registryInfo(permitRows);
   const centerMarker=geometry(aid,record,property,geometryLayer,permitContext);
   const html='<h3>'+esc(title)+'</h3><p>Airbnb displayed '+esc(record.displayed_numbers.join(', '))+
    '. Linked by permit number to the Pooler register.<br>'+privacyRadiusField(record.radius_meters)+'</p>'+registryInfo(permitRows)+
    link('https://www.airbnb.com/rooms/'+aid,'Airbnb listing');
   const marker=property?point({...permit,removed_reason:record.removed_reason},group('Pooler · displayed permit matches'),{title,html},
    licensed(permit)?green:purple,licensed(permit)?green:'#fff',7):centerMarker;
   if(property&&marker)propertyMarkers.set(aid,marker);
   if(aid===requestedListing&&marker)requestedPin=marker;
  }else if(reviewedIds.has(aid)||rejectedIds.has(aid)||countyFlagged.has(aid)||permitRows.length){
   const candidateText=permitRows.length>1?'<p>Multiple Pooler permit matches need review.</p>'+registryInfo(permitRows):'';
   const marker=geometry(aid,record,null,geometryLayer,candidateText);
   if(aid===requestedListing&&marker&&!requestedPin)requestedPin=marker;
  }else if(record.imported){
   const marker=geometry(aid,record,null,scrapeLayer);
   if(aid===requestedListing&&marker){
    scrapeLayer.addTo(map);
    requestedPin=marker;
   }
  }
 }
 const registryGroups=new Map();
 for(const row of registry.records){
  if(row.map_status!=='mapped')continue;
  const k=JSON.stringify([row.jurisdiction,row.normalized_address,row.unit,row.latitude,row.longitude]);
  if(!registryGroups.has(k))registryGroups.set(k,[]);
  registryGroups.get(k).push(row);
 }
 const registryPositions=new Set();
 for(const grouped of registryGroups.values()){
  const row=grouped[0],k=key(row.normalized_address,row.unit),arc=row.jurisdiction==='UNINCORPORATED'?arcByAddress.get(k):null;
  if(arc)registryPositions.add(k);
  const rows=grouped.filter(r=>!mergedSourceIds.has(r.source_id));
  if(!rows.length)continue;
  const title=row.normalized_address+(row.unit?' · '+row.unit:'');
  const jurisdiction=row.jurisdiction==='UNINCORPORATED'?'Chatham County':row.jurisdiction;
  const isLicensed=rows.some(licensed)||Boolean(arc?.records.some(arcLicensed));
  point(row,group('License list · '+jurisdiction),{title,html:'<h3>'+esc(title)+'</h3><p>Mapped jurisdiction: '+esc(row.actual_jurisdiction||'Unknown')+'</p>'+registryInfo(rows)+arcInfo(arc)+
   '<p>'+esc(row.match_note)+'</p>'+link('registry/index.html','License lists and CSVs')},isLicensed?green:purple,isLicensed&&row.jurisdiction==='POOLER'?green:'#fff',5);
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
 const jurisdictionFillOpacity=.28;
 const jurisdictionAreas=L.geoJSON(boundaries,{pane:'jurisdiction-boundaries',renderer:L.svg({pane:'jurisdiction-boundaries'}),interactive:false,
  style:feature=>{
   const color=palette[feature.properties.NAME]||'#687280';
   return {color,weight:2,opacity:.85,fill:true,fillColor:color,fillOpacity:jurisdictionFillOpacity};
  }}).addTo(map);
 overlays['Jurisdiction shading (SAGIS)']=jurisdictionAreas;
 map.createPane('savannah-stvr-zoning');
 const zoningPane=map.getPane('savannah-stvr-zoning');
 zoningPane.style.zIndex=360;
 zoningPane.style.pointerEvents='none';
 const outlinePane=map.createPane('savannah-stvr-outline');
 outlinePane.style.zIndex=380;
 outlinePane.style.pointerEvents='none';
 const zoningFill=L.geoJSON(outsideOverlay,{
  filter:feature=>feature.properties.role!=='boundary',
  pane:'savannah-stvr-zoning',renderer:L.svg({pane:'savannah-stvr-zoning'}),interactive:false,
  style:{stroke:false,fillColor:'#efc42b',fillOpacity:.23}
 });
 const zoningOutline=L.geoJSON(outsideOverlay,{
  filter:feature=>feature.properties.role==='boundary',
  pane:'savannah-stvr-outline',renderer:L.svg({pane:'savannah-stvr-outline'}),interactive:false,
  style:{color:'#59616b',weight:3,opacity:.95,fill:false}
 });
 overlays['Savannah outside the STVR overlay']=L.layerGroup([zoningFill,zoningOutline]).addTo(map);
 map.createPane('licensed-parcels');
 map.getPane('licensed-parcels').style.zIndex=370;
 const parcelRenderer=L.canvas({pane:'licensed-parcels'});
 overlays['Licensed parcels (green fill)']=L.geoJSON(parcels,{pane:'licensed-parcels',renderer:parcelRenderer,
  style:{color:'#08713b',weight:1.4,opacity:.85,fillColor:'#28a856',fillOpacity:.3},
  onEachFeature:(feature,layer)=>{
   const records=feature.properties.license_source_ids.map(id=>registryById.get(id)).filter(Boolean);
   const addresses=[...new Set(records.map(row=>row.normalized_address))];
   layer.bindPopup('<h3>'+esc(addresses.join(' / ')||'Licensed parcel')+'</h3><p>SAGIS parcel '+esc(feature.properties.pin)+
    '</p>'+registryInfo(records),popupOptions());
  }}).addTo(map);
 L.control.layers(null,overlays,{collapsed:true}).addTo(map);
 const legend=L.control({position:'bottomleft'});
 legend.onAdd=()=>{
  const box=L.DomUtil.create('div','map-legend');
  box.innerHTML='<div><span style="background:#a3dbb1;border-color:#08713b;border-radius:2px"></span> Licensed parcel</div>'+
   '<div><span style="background:#f6e7a2;border-color:#bd9212;border-radius:2px"></span> Savannah outside STVR overlay</div>'+
   '<div><span style="background:#c81724;border-color:#8d111b"></span> Guests over listed capacity</div>'+
   '<div><span class="reported-legend"></span> Complaint reported</div>'+
   '<div>☠️ Removed from Airbnb</div>'+
   '<div><span style="border-color:'+green+'"></span> Listed as licensed</div>'+
   '<div><span style="background:'+yellow+'"></span> License absent from saved Airbnb text</div>'+
   '<div><span class="mid-term-legend"></span> '+esc(midTermLabel)+'</div>'+
   '<div><span style="background:#fff;border-color:'+centerColor+'"></span> Airbnb map center · blue circle and dashed property link where available</div>'+
   '<div><span style="background:#e1c9ff"></span> Chatham County likely-unlicensed list</div>'+
   '<details><summary>Jurisdiction colors</summary>'+Object.entries(palette).map(([name,color])=>
    '<div><span style="border-color:'+color+';background:color-mix(in srgb,'+color+' '+jurisdictionFillOpacity*100+'%,transparent);border-radius:2px"></span> '+esc(name)+'</div>').join('')+'</details>';
  L.DomEvent.disableClickPropagation(box);
  return box;
 };
 legend.addTo(map);
 if(requestedPin){map.setView(requestedPin.getLatLng(),17,{animate:false});requestedPin.fire('click')}
 return rejected;
}

main().catch(e=>document.getElementById('summary').textContent=e.message);
