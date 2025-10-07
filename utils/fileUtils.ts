/**
 * Converts a data URL string into a Blob object.
 */
export const dataURLtoBlob = (dataurl: string): Blob | null => {
  const arr = dataurl.split(',');
  if (arr.length < 2) return null;
  
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], {type:mime});
};


/**
 * Converts a data URL string into a File object.
 */
export const dataURLtoFile = (dataurl: string, filename: string): File | null => {
  const blob = dataURLtoBlob(dataurl);
  if (!blob) return null;
  return new File([blob], filename, { type: blob.type });
};
