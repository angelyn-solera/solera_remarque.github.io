const editorStates = [];
let currentStateIndex = -1;
let currentAccess = 'anyone';
let currentFileHandle = null;
let pageCount = 1;
let isDrawingMode = false;
let currentCanvas = null;
let drawingContext = null;

// Initialize the editor
document.addEventListener('DOMContentLoaded', function() {
    saveEditorState();
    checkPageFull();
    
    // Load saved content if available
    const savedContent = localStorage.getItem('documentContent');
    if (savedContent) {
        document.getElementById('editor-container').innerHTML = savedContent;
        reinitializeImages();
        reinitializeCanvases();
        pageCount = document.querySelectorAll('.page').length;
    }
});

function saveEditorState() {
    const editorContainer = document.getElementById('editor-container');
    const currentState = editorContainer.innerHTML;
    editorStates.splice(currentStateIndex + 1);
    editorStates.push(currentState);
    currentStateIndex = editorStates.length - 1;
    
    // Save to localStorage
    localStorage.setItem('documentContent', editorContainer.innerHTML);
    localStorage.setItem('documentTitle', document.getElementById('document-title').textContent);
}

function handleUndo() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        const editorContainer = document.getElementById('editor-container');
        editorContainer.innerHTML = editorStates[currentStateIndex];
        reinitializeImages();
        reinitializeCanvases();
    }
}

function formatText(command) {
    document.execCommand(command, false, null);
    saveEditorState();
}

function alignText(command) {
    document.execCommand(command, false, null);
    saveEditorState();
}

// Document title handling
const documentTitle = document.getElementById('document-title');
documentTitle.addEventListener('input', () => {
    localStorage.setItem('documentTitle', documentTitle.textContent);
});

const savedTitle = localStorage.getItem('documentTitle');
if (savedTitle) {
    documentTitle.textContent = savedTitle;
}

function handlePrint() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${documentTitle.textContent}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20mm;
                    margin: 0;
                }
                @page {
                    size: A4;
                    margin: 20mm;
                }
                img {
                    max-width: 100%;
                }
                .page {
                    page-break-after: always;
                    margin-bottom: 20px;
                }
                canvas {
                    max-width: 100%;
                    height: auto;
                }
            </style>
        </head>
        <body>
            ${document.getElementById('editor-container').innerHTML}
            <script>
                setTimeout(function() {
                    window.print();
                    window.close();
                }, 200);
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function changeFontSize() {
    const fontSize = document.getElementById("fontSize").value;
    document.execCommand("fontSize", false, "7");
    const fontElements = document.getElementsByTagName("font");
    for (let i = 0; i < fontElements.length; i++) {
        if (fontElements[i].size == "7") {
            fontElements[i].removeAttribute("size");
            fontElements[i].style.fontSize = fontSize + "px";
        }
    }
}

function changeFontFamily(font) {
    document.execCommand('fontName', false, font);
    saveEditorState();
}

function changeTextColor(color) {
    document.execCommand('foreColor', false, color);
    saveEditorState();
}

function setLineHeight(height) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.lineHeight = height;
        range.surroundContents(span);
        saveEditorState();
    }
}

// Editor placeholder
const editor = document.getElementById('page1');
editor.addEventListener('input', () => {
    if (editor.textContent.trim() === '') {
        editor.setAttribute('data-placeholder', 'Start typing here...');
    } else {
        editor.removeAttribute('data-placeholder');
    }
    saveEditorState();
    checkPageFull();
});

if (editor.textContent.trim() === '') {
    editor.setAttribute('data-placeholder', 'Start typing here...');
}

// Dropdown functionality
function toggleDropdown(dropdownId) {
    closeAllSubmenus();
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}

function toggleSubmenu(submenuId) {
    closeAllSubmenus();
    const submenu = document.getElementById(submenuId);
    submenu.classList.toggle('show-submenu');
}

function closeAllSubmenus() {
    document.querySelectorAll('.submenu').forEach(menu => {
        menu.classList.remove('show-submenu');
    });
}

window.onclick = function(event) {
    if (!event.target.matches('.insert') && 
        !event.target.matches('.file') && 
        !event.target.matches('.format') &&
        !event.target.matches('.share') &&
        !event.target.closest('.has-submenu')) {
        
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
        closeAllSubmenus();
    }
}

// File input for image upload
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'resizable-img';
            imgContainer.style.display = 'inline-block';
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(resizeHandle);
            
            // Get current page or create new one if current is full
            let currentPage = getCurrentPage();
            if (!currentPage) {
                insertNextPage();
                currentPage = document.getElementById(`page${pageCount}`);
            }
            
            currentPage.appendChild(imgContainer);
            makeImageResizable(imgContainer);
            saveEditorState();
        };
        reader.readAsDataURL(file);
    }
});

function makeImageResizable(element) {
    const img = element.querySelector('img');
    const handle = element.querySelector('.resize-handle');
    
    let startX, startY, startWidth, startHeight;
    
    function initDrag(e) {
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(img).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(img).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }
    
    function doDrag(e) {
        img.style.width = (startWidth + e.clientX - startX) + 'px';
        img.style.height = (startHeight + e.clientY - startY) + 'px';
    }
    
    function stopDrag() {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
        saveEditorState();
    }
    
    handle.addEventListener('mousedown', initDrag, false);
}

function reinitializeImages() {
    document.querySelectorAll('.resizable-img').forEach(imgContainer => {
        if (!imgContainer.querySelector('.resize-handle')) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            imgContainer.appendChild(resizeHandle);
            makeImageResizable(imgContainer);
        }
    });
}

function reinitializeCanvases() {
    document.querySelectorAll('.resizable-img').forEach(container => {
        const canvas = container.querySelector('.drawing-canvas');
        if (canvas) {
            if (!container.querySelector('.resize-handle')) {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                container.appendChild(resizeHandle);
            }
            setupCanvasDrawing(canvas);
            makeCanvasResizable(container);
        }
    });
}

// Insert functions
function insertImage() {
    document.getElementById('file-input').click();
}

function insertTable() {
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    const rows = prompt('Enter number of rows:');
    const cols = prompt('Enter number of columns:');
    if (rows && cols) {
        let table = '<table border="1" style="width: 100%;">';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += `<td>Cell ${i + 1}-${j + 1}</td>`;
            }
            table += '</tr>';
        }
        table += '</table>';
        currentPage.innerHTML += table;
        saveEditorState();
    }
}

function insertHorizontalLine() {
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    currentPage.innerHTML += '<hr>';
    saveEditorState();
}

function insertHeader() {
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    const headerText = prompt('Enter header text:');
    if (headerText) {
        currentPage.innerHTML += `<h1>${headerText}</h1>`;
        saveEditorState();
    }
}

function insertNextPage() {
    pageCount++;
    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.id = `page${pageCount}`;
    newPage.contentEditable = 'true';
    newPage.setAttribute('placeholder', 'Start typing here...');
    document.getElementById('editor-container').appendChild(newPage);
    
    // Focus on the new page
    setTimeout(() => {
        newPage.focus();
    }, 0);
    
    saveEditorState();
}

function checkPageFull() {
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    // Check if the page content exceeds the visible height
    if (currentPage.scrollHeight > currentPage.clientHeight) {
        // Move excess content to a new page
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Find the last visible element
        let lastVisibleElement = null;
        let elements = currentPage.children;
        
        for (let i = elements.length - 1; i >= 0; i--) {
            if (elements[i].offsetTop < currentPage.clientHeight) {
                lastVisibleElement = elements[i];
                break;
            }
        }
        
        if (lastVisibleElement && lastVisibleElement.nextSibling) {
            insertNextPage();
            const newPage = document.getElementById(`page${pageCount}`);
            
            // Move all elements after the last visible one to the new page
            let node = lastVisibleElement.nextSibling;
            while (node) {
                const nextNode = node.nextSibling;
                newPage.appendChild(node);
                node = nextNode;
            }
            
            saveEditorState();
        }
    }
}

function getCurrentPage() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    let currentNode = selection.anchorNode;
    while (currentNode && !currentNode.classList?.contains('page')) {
        currentNode = currentNode.parentNode;
    }
    
    return currentNode || document.getElementById(`page${pageCount}`);
}

// Drawing functions
function startDrawing() {
    isDrawingMode = true;
    document.getElementById('drawing-tools').style.display = 'block';
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'resizable-img';
        canvasContainer.style.display = 'inline-block';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'drawing-canvas';
        canvas.width = 500;
        canvas.height = 300;
        canvas.style.border = '1px solid #000';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        
        canvasContainer.appendChild(canvas);
        canvasContainer.appendChild(resizeHandle);
        range.insertNode(canvasContainer);
        
        currentCanvas = canvas;
        drawingContext = canvas.getContext('2d');
        
        setupCanvasDrawing(canvas);
        makeCanvasResizable(canvasContainer);
        saveEditorState();
    }
}

function makeCanvasResizable(element) {
    const canvas = element.querySelector('canvas');
    const handle = element.querySelector('.resize-handle');
    
    let startX, startY, startWidth, startHeight;
    
    function initDrag(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(canvas).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(canvas).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }
    
    function doDrag(e) {
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        
        // Maintain minimum size
        if (newWidth > 50 && newHeight > 50) {
            canvas.style.width = newWidth + 'px';
            canvas.style.height = newHeight + 'px';
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Redraw existing content at new size
            if (drawingContext) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = startWidth;
                tempCanvas.height = startHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, 0);
                
                drawingContext.clearRect(0, 0, newWidth, newHeight);
                drawingContext.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
            }
        }
    }
    
    function stopDrag() {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
        saveEditorState();
    }
    
    handle.addEventListener('mousedown', initDrag, false);
}

function setupCanvasDrawing(canvas) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    function updateDrawingSettings() {
        ctx.strokeStyle = document.getElementById('drawing-color').value;
        ctx.lineWidth = document.getElementById('brush-size').value;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
    
    updateDrawingSettings();
    
    document.getElementById('drawing-color').addEventListener('change', updateDrawingSettings);
    document.getElementById('brush-size').addEventListener('input', updateDrawingSettings);
    
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        lastX = currentX;
        lastY = currentY;
    });
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        saveEditorState();
    });
    
    canvas.addEventListener('mouseout', () => {
        isDrawing = false;
        saveEditorState();
    });
    
    // Touch support for mobile devices
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        lastX = currentX;
        lastY = currentY;
    });
    
    canvas.addEventListener('touchend', () => {
        isDrawing = false;
        saveEditorState();
    });
}

function finishDrawing() {
    isDrawingMode = false;
    document.getElementById('drawing-tools').style.display = 'none';
    saveEditorState();
}

function clearDrawing() {
    if (currentCanvas) {
        const ctx = currentCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        saveEditorState();
    }
}

// File functions
async function newFile() {
    if (confirm('Are you sure you want to create a new file? All unsaved changes will be lost.')) {
        document.getElementById('editor-container').innerHTML = '<div class="page" contenteditable="true" id="page1" placeholder="Start typing here..."></div>';
        document.getElementById('document-title').textContent = 'Untitled document';
        currentFileHandle = null;
        pageCount = 1;
        saveEditorState();
    }
}

async function openFile() {
    try {
        // Try File System Access API first
        if ('showOpenFilePicker' in window) {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'HTML Files',
                    accept: {'text/html': ['.html']}
                }]
            });
            
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            document.getElementById('editor-container').innerHTML = content;
            document.getElementById('document-title').textContent = file.name.replace(/\.[^/.]+$/, "");
            currentFileHandle = fileHandle;
            reinitializeImages();
            reinitializeCanvases();
            pageCount = document.querySelectorAll('.page').length;
            saveEditorState();
        } else {
            // Fallback for browsers without File System Access API
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.txt';
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('editor-container').innerHTML = event.target.result;
                    document.getElementById('document-title').textContent = file.name.replace(/\.[^/.]+$/, "");
                    reinitializeImages();
                    reinitializeCanvases();
                    pageCount = document.querySelectorAll('.page').length;
                    saveEditorState();
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (err) {
        console.error('Error opening file:', err);
        alert('Error opening file: ' + err.message);
    }
}

async function saveFile() {
    try {
        const content = generateFullHTML();
        const title = document.getElementById('document-title').textContent;
        
        // If we already have a file handle, write to it
        if (currentFileHandle) {
            const writable = await currentFileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            alert('File saved successfully!');
        } else {
            // Otherwise, use save as
            await saveAsFile();
        }
    } catch (err) {
        console.error('Error saving file:', err);
        alert('Error saving file. Trying fallback method...');
        downloadFile(); // Fallback
    }
}

async function saveAsFile() {
    try {
        const content = generateFullHTML();
        const title = document.getElementById('document-title').textContent;
        
        // Try File System Access API first
        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: `${title}.html`,
                types: [{
                    description: 'HTML Files',
                    accept: {'text/html': ['.html']}
                }]
            });
            
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            
            currentFileHandle = handle;
            alert('File saved successfully!');
        } else {
            // Fallback for browsers without File System Access API
            downloadFile();
        }
    } catch (err) {
        console.error('Error saving file:', err);
        if (err.name !== 'AbortError') {
            alert('Error saving file. Trying fallback method...');
            downloadFile(); // Fallback
        }
    }
}

function generateFullHTML() {
    const title = document.getElementById('document-title').textContent;
    const content = document.getElementById('editor-container').innerHTML;
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
        }
        .page {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-after: always;
        }
        img {
            max-width: 100%;
        }
        canvas {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}

function makeCopy() {
    const content = generateFullHTML();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-copy.html';
    a.click();
    URL.revokeObjectURL(url);
}

function downloadFile() {
    const content = generateFullHTML();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.getElementById('document-title').textContent + '.html';
    a.click();
    URL.revokeObjectURL(url);
}

function moveFile() {
    alert('Move file functionality would be implemented here in a full application.');
}

function moveToTrash() {
    if (confirm('Are you sure you want to move this file to the trash?')) {
        localStorage.removeItem('documentContent');
        localStorage.removeItem('documentTitle');
        document.getElementById('editor-container').innerHTML = '<div class="page" contenteditable="true" id="page1" placeholder="Start typing here..."></div>';
        document.getElementById('document-title').textContent = 'Untitled document';
        currentFileHandle = null;
        pageCount = 1;
        saveEditorState();
        alert('File moved to trash.');
    }
}

// Share functions
function copyLink() {
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = window.location.href;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert('Link copied to clipboard!');
}

function setAccess(accessLevel) {
    currentAccess = accessLevel;
    alert('Access changed to: ' + accessLevel);
}