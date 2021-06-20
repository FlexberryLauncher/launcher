// custom close button
document.getElementById("close").addEventListener("click", function() {
    ipcRenderer.send('close')
});

// completely useless theme switch, i guess i'll remove it
document.getElementById("title").addEventListener("click", function() {
    ipcRenderer.send("switchTheme")
})