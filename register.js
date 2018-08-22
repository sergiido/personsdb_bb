
function readSingleFile(fileInput) {
	var image = document.getElementById('userava');
  	var file  = fileInput.files[0];
	// console.log(file.size);
	var reader = new FileReader();
	reader.onload = function() {
		if (file.size < 400000) {
			image.src = reader.result;
		} else {
			alert ("File size > 400Kb");
		}
	};
	reader.readAsDataURL(file);
}