(function(root){
'use strict';
var OPTIONAL_TYPES={'กราฟิก':1,'รูปภาพ':1,'คัดคลิป':1,'rlees':1,'สร้างเพจ':1};
function evidenceOptional(type){
  return !!OPTIONAL_TYPES[String(type||'').trim().toLowerCase()];
}
function evidenceRequired(type,status,hasClip,hasFix,hasSubmit){
  if(evidenceOptional(type))return false;
  /* A correction may be delivered as either a link or an uploaded image.
     Requiring a link after an employee already attached corrected artwork
     made the visible "ส่งตรวจอีกครั้ง" action impossible to complete. */
  return status==='revision'?!hasFix&&!hasSubmit:!hasClip&&!hasFix&&!hasSubmit;
}
root.rbOrderEvidenceOptional=evidenceOptional;
root.rbOrderEvidenceRequired=evidenceRequired;
if(typeof module!=='undefined'&&module.exports)module.exports={evidenceOptional:evidenceOptional,evidenceRequired:evidenceRequired,optionalTypes:Object.keys(OPTIONAL_TYPES)};
})(typeof window!=='undefined'?window:globalThis);
