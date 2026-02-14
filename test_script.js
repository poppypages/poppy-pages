const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzg5p1Yh7RhuhY8VEJyzgbBEQW73F5C8csxZqqIJ_DqWexlH44jkpjc-Vk_gTvYwPPY9g/exec';

fetch(GOOGLE_SCRIPT_URL + '?action=getPosts')
  .then(res => res.json())
  .then(data => {
    console.log('SUCCESS: Script is responsive.');
    console.log('Posts found:', data.length);
  })
  .catch(err => {
    console.error('ERROR: Script failed or returned non-JSON.');
    console.error(err);
  });
