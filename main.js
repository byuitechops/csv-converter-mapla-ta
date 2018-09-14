const headersToCheck = ['Last', 'Given', 'Student ID', 'Total'];
const headersToKeep = ['Student', 'Student ID', 'Section'];
const headersToDelete = ['', 'Last', 'Given', 'Total'];
let downloading,
    files,
    invalidFiles,
    newFiles,
    downloadButton = document.querySelector('[id="download"]'),
    convertButton = document.getElementById('convert'),
    chooseFiles = document.getElementById('choose_files'),
    dropText = document.getElementById('dropText');

/***************************************************
 *                    init()
 * 
 * Initializes the necessary global variables and
 * modifies some of the elements on the page. This
 * function is called once the page has loaded and
 * after the user clicks the download button.
 * 
 * Return Type: void
 ***************************************************/
function init() {
    newFiles = [];
    files = [];
    invalidFiles = [];
    // Reset the text after downloading
    document.getElementById('valid').innerHTML = '';
    document.getElementsByClassName('browser-default')[0].style.display = 'block';
    dropText.innerHTML = 'Drag and Drop CSV Files Here';
    downloading = false;
    // Fix buttons for after downloading
    convertButton.style.display = 'inline-block';
    convertButton.classList.add('disabled');
    downloadButton.disabled = true;
    downloadButton.style.display = 'none';
    chooseFiles.style.display = 'block';
}

/***************************************************
 *                    modifyCSV()
 * 
 * Modifies the data to conform to Canvas standards.
 * While converting, the function makes a loading
 * wheel appear. The modified data is stored in the
 * newFiles array.
 * 
 * Return Type: void
 ***************************************************/
function modifyCSV() {
    files.forEach((file, i) => {
        newFiles.push({
            fileName: file.fileName,
            data: []
        });
        file.data.forEach(student => {
            if (student[''] !== 'Total Points') {
                student.Student = `${student.Last}, ${student.Given}`;
                student.Section = '';
                headersToDelete.forEach(header => {
                    delete student[header];
                });
                newFiles[i].data.push(student);
            }
        });
    });
}

/***************************************************
 *                 removeDragData()
 * 
 * Clears any leftover data from the user dragging
 * and dropping files.
 * 
 * Return Type: void
 ***************************************************/
function removeDragData(event) {
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to remove the drag data
        event.dataTransfer.items.clear();
    } else {
        // Use DataTransfer interface to remove the drag data
        event.dataTransfer.clearData();
    }
}

/***************************************************
 *                 checkForDuplicates()
 * 
 * Checks if the user is uploading a file that has
 * already been uploaded.
 * 
 * Return Type: bool
 ***************************************************/
function checkForDuplicates(fileName) {
    if (invalidFiles.some(file => fileName === file)) {
        // The user is trying to upload a file that has already been uploaded. Stop them.
        return true;
    }
    if (files.some(file => fileName === file.fileName)) {
        // The user is trying to upload a file that has already been uploaded. Stop them.
        return true;
    }
    return false;
}

/***************************************************
 *                 validateCSV()
 * 
 * Validates the CSV file. The regEx should match
 * the column headers of the file. Note: Columns
 * that are static can be hard coded while columns
 * that are dynamic, I.E assignment names, need to
 * be accounted for.
 * 
 * Return Type: Array/null
 ***************************************************/
function validateCSV(data) {
    return headersToCheck.every(header => data.columns.includes(header));
}

/***************************************************
 *                   addToTable()
 * 
 * Adds a file to the valid or invalid table
 * depending on whether validation was passed.
 * 
 * Return Type: void
 ***************************************************/
function addToTable(fileName, tableId) {
    let table = document.getElementById(tableId);
    let lastRow = table.querySelector('tr:last-child');
    if (!lastRow || lastRow.children.length === 5) {
        lastRow = document.createElement('tr');
        table.appendChild(lastRow);
    }
    let tableData = document.createElement('td');
    let node = document.createTextNode(fileName);
    tableData.appendChild(node);
    lastRow.appendChild(tableData);
}

/***************************************************
 *                  fileOnLoad()
 * 
 * This function is ran on each file that is
 * uploaded by the user. It calls the necessary
 * function to determine is the file is accepted.
 * 
 * Return Type: void
 ***************************************************/
function fileOnLoad(event, fileName) {
    if (checkForDuplicates(fileName)) {
        return;
    }
    event.target.result = event.target.result.replace(/\ufeff/g, '');
    let data = d3.csvParse(event.target.result);
    if (validateCSV(data)) {
        convertButton.classList.remove('disabled');
        files.push({
            fileName,
            data
        });
        addToTable(fileName, 'valid');
    } else {
        invalidFiles.push(fileName);
        addToTable(fileName, 'invalid');
        document.getElementById('invalidMSG').innerHTML = `*Please check that each CSV file contains the following column headers: ${headersToCheck.join(', ')}`;
        document.getElementById('invalid_zone').style.display = 'block';
    }
}

/***************************************************
 *           makeTheUserWaitForNoReason()
 * 
 * The modifyCSV() function runs instantaniously,
 * however to give the impression of conversion a 
 * loader will appear on the screen for 1-2 seconds.
 * Then the download will be allowed.
 *       
 * Return Type: void
 ***************************************************/
function makeTheUserWaitForNoReason() {
    let content = document.getElementById('content');
    let loader = document.getElementById('loader');
    content.style.display = 'none';
    loader.style.display = 'inline-block';
    window.setTimeout(() => {
        chooseFiles.style.display = 'none';
        document.getElementById('invalid_zone').style.display = 'none';
        document.getElementById('invalid').innerHTML = '';
        document.getElementsByClassName('browser-default')[0].style.display = 'none';
        loader.style.display = 'none';
        content.style.display = 'block';
        // Allow the download
        downloading = true;
        convertButton.style.display = 'none';
        downloadButton.disabled = false;
        downloadButton.style.display = 'inline-block';
        dropText.innerHTML = 'Canvas CSV Download Ready';
    }, Math.floor(Math.random() * 2 * 1000 + 1000));
}

/* -- Event Listeners -- */

/***************************************************
 *             Download Button Listener
 * 
 * This listener's purpose is to run once the
 * the download is ready and the user clicks the 
 * download button. The function puts each converted
 * file into a single zipped folder. Once each file
 * has been placed the download starts.  
 ***************************************************/
downloadButton.addEventListener('click', () => {
    // If the user is converting only 1 file, don't zip it
    if (newFiles.length === 1) {
        let soloFile = newFiles[0];
        let headers = headersToKeep.concat(Object.keys(soloFile.data[0]).filter(n => !headersToKeep.includes(n)));
        soloFile.fileName = soloFile.fileName.slice(0, soloFile.fileName.length - 4) + '(Canvas Ready).csv';
        download(d3.csvFormat(soloFile.data, headers), soloFile.fileName, 'text/plain');
        init();
    } else {
        let zip = new JSZip();
        let now = moment();
        newFiles.forEach((newFile) => {
            let headers = headersToKeep.concat(Object.keys(newFile.data[0]).filter(n => !headersToKeep.includes(n)));
            newFile.fileName = newFile.fileName.slice(0, newFile.fileName.length - 4) + '(Canvas Ready).csv';
            zip.file(newFile.fileName, d3.csvFormat(newFile.data, headers));
        });
        zip.generateAsync({
            type: 'blob'
        }).then(blob => {
            saveAs(blob, `CanvasReadyCSVs(${now.format('YYYY[Y]-MM[M]-DD[D]-hh[h]-mm[m]-SS[s]')}).zip`);
            init();
        }, err => {
            console.error(err);
            alert('There was an error downloading the zip file containing the CSVs');
        });
    }
});

/***************************************************
 *            Choose File Button Listener
 * 
 * This listener's purpose is to run once the user
 * has selected files from their file explorer. The
 * function checks for duplicates and validates each
 * file. Once a file validates the file is pushed 
 * to the files array. 
 ***************************************************/
document.getElementById('file').addEventListener('change', event => {
    let tempFiles = Array.from(event.target.files);
    tempFiles.forEach(file => {
        let fileReader = new FileReader();
        fileReader.onload = (event) => fileOnLoad(event, file.name);
        fileReader.readAsText(file);
    });
});

/***************************************************
 *         Drop Zone Drag and Drop Listener
 * 
 * This listener's purpose is to run once the user
 * drops files into the drop zone. The function 
 * checks for duplicates and validates each file. 
 * Once a file validates the file is pushed onto the
 * files array. 
 ***************************************************/
document.getElementById('drop_zone').addEventListener('drop', event => {
    event.preventDefault();
    // If the user tries to drop files after converting, don't do anything
    if (downloading) return;
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                let file = event.dataTransfer.items[i].getAsFile();
                if (file.name.match(/.csv$/)) {
                    let fileReader = new FileReader();
                    fileReader.onload = (event) => fileOnLoad(event, file.name);
                    fileReader.readAsText(file);
                } else {
                    console.error('Unsupported file type!');
                }
            }
        }
        // Pass event to removeDragData for cleanup
        removeDragData(event);
    }
});

// Prevents a file from executing its default action (Download or open in browser)
window.addEventListener('dragover', event => {
    event.preventDefault();
});

// Prevents a file from executing its default action (Download or open in browser)
window.addEventListener('drop', event => {
    event.preventDefault();
});

// Checks if the files array's length is greater than 0 before allowing the modifyCSV function to run 
document.getElementById('convert').addEventListener('click', () => {
    if (files.length > 0) {
        makeTheUserWaitForNoReason();
        modifyCSV();
    }
});

// Resets the page by refreshing it. Note: This could break is the user loses connection
document.getElementById('reset').addEventListener('click', () => {
    window.location.reload();
});

document.addEventListener('DOMContentLoaded', () => {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems);
});

// This will initialize necessary variables and manipulate the DOM
init();