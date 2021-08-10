// custom close button
document.getElementById("close").addEventListener("click", function () {
    ipcRenderer.send('close')
});