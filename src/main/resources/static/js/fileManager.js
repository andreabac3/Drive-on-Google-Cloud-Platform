/* eslint no-unused-vars: "error"*/

// Stack class
const Stack = class Stack {
  // / items;

  // Array is used to implement stack
  constructor() {
    this.items = [];
  }

  // push function
  push(element) {
    // push element into the items
    this.items.push(element);
  }

  // pop function
  pop() {
    // return top most element in the stack
    // and removes it from the stack
    // Underflow if stack is empty
    if (this.items.length === 0) {
      return 'Underflow';
    }
    return this.items.pop();
  }

  // peek function
  peek() {
    // return the top most element from the stack
    // but doesn't delete it.
    return this.items[this.items.length - 1];
  }

  // isEmpty function
  isEmpty() {
    // return true if stack is empty
    return this.items.length === 0;
  }

  // printStack function
  printStack() {
    let str = '';
    for (let i = 0; i < this.items.length; i++) {
      str += this.items[i] + ' ';
    }
    return str;
  }
};

class TreeUtils {
  static constructLinksMap(structure, links) {
    const map = {};
    for (let i = 0; i < structure.length; i++) {
      map[structure[i]] = links[i];
    }

    return map;
  }

  static replaceUuid(structure, uuid) {
    for (let i = 0; i < structure.length; i++) {
      structure[i] = structure[i].replace(uuid, '');
    }
  }

  static filterEntries(entries, basepath) {
    // console.log('filter_entries', entries);

    const subtree = entries.filter((path) => {
      return path.startsWith(basepath) && basepath !== path;
    });

    const sliced = subtree.map((item) => {
      const sliced = item.slice(basepath.length);
      let name = sliced.split('/')[0];

      if (sliced[name.length] === '/') {
        name += '/';
      }

      return basepath + name;
    });

    const result = new Set(sliced).values();

    return Array.from(result);
  }
}

const PreviewManager = class PreviewManager {
  static icon() {
    return {
      folder: 'folder_icon.png',
      file: 'folder_icon.png',
    };
  }

  constructor() {
  }

  static getString(itemIcon, itemName, funct, downloadFunc, isFolder) {
    return `<div class='filediv text-center'>
                    <div style="width: 100%">
                      <button type="button" onclick="${funct}" class="btn btn-outline-primary btn-block cms-outline text-left file-button">              
                      <img alt="Item icon" class="invert huerotate" src="/icons/${itemIcon} ">
                      ${itemName} 
                     
                      </button>
                    </div>
                     <div style="float: right;">
                     
                     <span style="float: right; vertical-align: middle;">
                       <img alt="Download icon" style="width:20px; cursor: pointer;" src="/icons/download.png" onclick="${downloadFunc}">
                       <img alt="Trash icon" style="width:20px; cursor: pointer;" src="/icons/trash.png" onclick="deleteFile('${itemName}', ${isFolder})">
                     </span>
                     </div>
                </div>`;
  }

  static insertEntries(entries) {
    entries.forEach(
        (path) => {
          const icon = PreviewManager.icon();
          const isFolder = FileManager.isFolder(path);
          if (isFolder) {
            const filename = get_filename(path.slice(0, -1));
            const folderDownloadFunc = `PreviewManager.downloadFolder('${path}')`;
            const browseFolderFunc = `browseFolder('${path}')`;
            const item = PreviewManager.getString(icon.folder, filename, browseFolderFunc, folderDownloadFunc, isFolder);
            $('#file-manager').append(item);
          } else {
            const filename = get_filename(path);
            const url = fileManager.folder_tree.links_map[path];
            const fileDownloadFunc = `PreviewManager.downloadFile('${url}', '${filename}')`;
            const previewFunc = `PreviewManager.previewShow('${url}', ${FileManager.mIsImage(path)})`;
            const item = PreviewManager.getString(icon.file, filename, previewFunc, fileDownloadFunc, isFolder);
            $('#file-manager').append(item);
          }
        },
    );
  }

  static previewHide() {
    const img = document.getElementById('img-preview');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';

    const downloadButton = document.getElementById('download-preview');
    downloadButton.hidden = true;
    downloadButton.href = 'javascript:void(0)';
  }

  static previewShow(link, showImage) {
    this.previewHide();

    if (showImage === true) {
      const preview = document.getElementById('img-preview');
      preview.src = link;
    }

    const downloadButton = document.getElementById('download-preview');
    downloadButton.hidden = false;
    downloadButton.href = link;

    document.getElementById('future-preview').style.display = 'block';

    const container = document.getElementById('future-download');
    container.style.display = 'none';
  }

  // Download single file from the Browser
  static downloadFile(url, filename) {
    fetch(url).then(function(t) {
      return t.blob().then((b) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.setAttribute('download', filename);
            a.click();
          },
      );
    });
  }

  // eslint-disable-next-line no-unused-vars
  static downloadFolder(path) {
    console.log('downloadFolder', path);
    if (confirm('Are you sure you want to download this folder?')) {
      fetch('/file/filesystem/getZip', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          prefix: path,
        }),
      }).then((response) => handleHttpErrors(response)).then((response) => response.json()).then((data) => {
        console.log('get_structure', data);
        handleErrors(data);
        const win = window.open(data['Result'], '_blank');
        win.focus();
      }).catch((error) => {
        console.log(error);
      });
    }
  }
};

const FileManager = class {
  constructor() {
    this.basepath = '/';
    this.UID = $.cookie('uid');
    this.fsHistory = new Stack();
    this.fsHistory.push(this.basepath);
    console.log(this.basepath);

    this.folder_tree = {
      structure: [],
      links_map: {},
    };
  }

  getStructure(path) {

    if (path === undefined){
      path = '/';
    }

    fetch('/file/filesystem', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        prefix: '/',
      }),
    }).then((response) => handleHttpErrors(response)).then((response) => response.json()).then((data) => {
      console.log('get_structure', data);
      handleErrors(data);
      $('#loading').hide();
      if (data.structure.length === 1) {
        $('#warning-no-products').show();
      } else {
        TreeUtils.replaceUuid(data.structure, this.UID);
        console.log('data.structure', data.structure);
        console.log('path', path);
        console.log('UUID', this.UID);
        this.folder_tree.structure = data.structure;
        console.log(this.folder_tree.structure);
        this.folder_tree.links_map = TreeUtils.constructLinksMap(data.structure, data.links);
        console.log('links_map', this.folder_tree.links_map);
        browseFolder(path, true, true);
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  backFsFolder() {
    console.log('Going back');
    if (!NAIVE_LOCK.fsHistory) {
      NAIVE_LOCK.fsHistory = true;

      console.log(this.fsHistory, this.fsHistory.items);
      this.fsHistory.pop();
      console.log(this.fsHistory.isEmpty());
      if (!this.fsHistory.isEmpty()) {
        console.log('going to:', this.fsHistory.peek());
        browseFolder(this.fsHistory.peek(), false);
        // browseFolder(basepath, false);
      } else {
        historyBack();
      }
      NAIVE_LOCK.fsHistory = false;
    }
  }

  static isFolder(path) {
    return path.endsWith('/');
  }

  static mIsImage(path) {
    const x = path.toLocaleLowerCase();
    for (let i = 0; i < IMAGE_EXTENSIONS.length; i++) {
      if (x.endsWith(IMAGE_EXTENSIONS[i])) {
        return true;
      }
    }

    return false;
  }

  static setCwd(path) {
    document.getElementById('cwd-path').innerText = 'My Drive' + path.replace(/<\d+>/g, '');
  }
};

const fileManager = new FileManager();

function browseFolder(path, save = true) {
  console.log('browseFolder', fileManager.fsHistory, path);
  PreviewManager.previewHide();

  if (save) {
    fileManager.fsHistory.push(path);
  }

  FileManager.setCwd(path);

  document.getElementById('file-manager').innerHTML = '';

  const filtered = TreeUtils.filterEntries(fileManager.folder_tree.structure, path);
  const sorted = filtered.sort(); // filtered.sort(sortFilesAndFolders);
  PreviewManager.insertEntries(sorted);

  document.getElementById('future-download').style.display = 'none';
}

// eslint-disable-next-line no-unused-vars
function deleteFile(fileName, isFolder) {
  console.log('deleteFile', fileName, 'isFolder', isFolder);

  if (confirm('Are you sure you want to delete ' + fileName + '?')) {
    let filepath = fileManager.fsHistory.peek() + '/' + fileName;
    filepath = filepath.replace('//', '/');
    if (isFolder === true) {
      console.log('Added slash');
      filepath += '/';
    }

    fetch('/file/filesystem/delete', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        filename: filepath,
      }),
    }).then((response) => handleHttpErrors(response)).then((response) => response.json()).then((data) => {
      console.log('get_structure', data);
      handleErrors(data);
      fileManager.getStructure(fileManager.fsHistory.peek());
    }).catch((error) => {
      console.log(error);
    });
  }
}

// eslint-disable-next-line no-unused-vars
function mkdir() {
  const folderName = prompt('Enter folder name');

  if (folderName.length === 0) {
    return;
  }
  let folderPath = fileManager.fsHistory.peek() + '/';
  folderPath = folderPath.replace('//', '/');

  let folderPathComplete = folderPath + folderName + '/';
  folderPathComplete = folderPathComplete.replace('//', '/');

  fetch('/file/filesystem/mkdir', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({
      pathFilename: folderPathComplete,
    }),
  }).then((response) => handleHttpErrors(response)).then((response) => response.json()).then((data) => {
    console.log('get_structure', data);
    handleErrors(data);
    fileManager.getStructure(folderPath);
  }).catch((error) => {
    console.log(error);
  });
}

function setFsBackArrow() {
  const header = document.getElementsByClassName('back-page-arrow')[0];

  if (header !== undefined) {
    console.log('setting header', header, header.innerHTML);
    header.onclick = function() {
      fileManager.backFsFolder();
    };
  }
}

PreviewManager.previewHide();

$(document).ready(function() {
  console.log('session_token', $.cookie('session_token'));

  fileManager.getStructure();

  setFsBackArrow();
});

// eslint-disable-next-line no-unused-vars
function uploadFiles() {
  const form = new FormData();
  const path = fileManager.fsHistory.peek();

  const files = $('#upload_files_input')[0].files;

  console.log('uploadFiles');
  console.log('files', files);

  $.each(files, function(i, file) {
    // file.name = get_prefix(banner_identifier) + file.name;
    // file.name = "PF_" + file.name;
    console.log(file);
    form.append('file', file);
    form.append('extradata', JSON.stringify({
      'prefix': path,
      'Authorization': getAuthHeader()['Authorization'],
    }));
  });

  // send form data with ajax
  return $.ajax({
    type: 'POST',
    // headers: getAuthHeader(),
    url: BASE_URL + '/banner/uploadFiles',
    cache: false,
    contentType: false,
    processData: false,
    data: form,
    success: function(result) {
      console.log(result);
      if (result.status === '1') {
        // TODO check meaning
        browseFolder(path);
      } else {
        alert('Upload successful');
        fileManager.getStructure(path);
      }
    },
    error: function(err) {
      console.log(err);
      alert('upload failed');
    },
  });
}
