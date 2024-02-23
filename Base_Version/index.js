let objectData = {};
let data = [];
let filenames = [];
let data2 = [];
const encodingSelect = document.getElementById("encodingSelect");
// Hiding table before parsing
let table = document.getElementById("result");
table.style.display = "none";

// Function to parse XML
function parseXML() {
  let fileInput = document.getElementById("fileInput");
  data = [];

  if (fileInput.files.length > 0) {
    filenames = Array.from(fileInput.files);
    for (let file of filenames) {
      parseFile(file);
    }
  } else {
    alert("Please select the XML file.");
  }
}

// Function to parse individual XML file
function parseFile(file) {
  const groupName = file.name.split(".xml")[0];
  let reader = new FileReader();
  reader.onload = function (e) {
    let xmlString = e.target.result;
    let encodingCharSet = EncodingCharSet() || encodingSelect.value;
    let textDecoder = new TextDecoder(encodingCharSet); // can be use UTF-8 or anything as per encoding require
    xmlString = textDecoder.decode(new Uint8Array(e.target.result));
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xmlString, "text/xml");
    let preferences = xmlDoc.querySelectorAll("preference");
    parsePreferences(preferences, groupName);
    document.getElementById("encoding").style.display = "none";
    displayTable();
  };
  reader.readAsArrayBuffer(file);
}

// Function to parse preferences from XML
function parsePreferences(preferences, groupName) {
  let count = 1;
  for (let i = 0; i < preferences.length; i++) {
    let name = preferences[i]
      .getAttribute("name")
      .split("_release_procedure")[0]
      .split("TC_")[1];
    let p1 = name?.split("JAG5_").length;
    let p2 = name?.split("BCT4_").length;
    let p3 = name?.split("Revision").length;
    let values = preferences[i].querySelectorAll(
      'context[name="Teamcenter"] > value'
    );
    for (let j = 0; j < values.length; j++) {
      let el = values[j].textContent.split("Unterprozess");
      if (el.length < 2 && (p1 >= 2 || p2 >= 2 || p3 >= 2)) {
        let valueText = values[j].textContent.trim();
        data.push([valueText, name, groupName]);
        updateObjectData(valueText, name, groupName);
        count++;
      }
    }
  }
}

// Function to update objectData
function updateObjectData(valueText, name, groupName) {
  if (!objectData[valueText]) {
    objectData[valueText] = {
      object_type: [name],
      group: [groupName],
    };
  } else {
    if (!objectData[valueText].object_type.includes(name)) {
      objectData[valueText].object_type.push(name);
    }
    if (!objectData[valueText].group.includes(groupName)) {
      objectData[valueText].group.push(groupName);
    }
  }
}

// Function to display table
function displayTable() {
  if (data.length <= 0) {
    alert("No workflows are present in the selected file.");
    return;
  }
  let tbody = document.getElementById("tbody");
  let msg = document.getElementById("msg");
  tbody.innerHTML = "";

  let count = 1;
  for (let item of data) {
    let row = document.createElement("tr");
    let [td1, td2, td3] = item;
    let r1 = document.createElement("td");
    let r2 = document.createElement("td");
    let r3 = document.createElement("td");
    let r4 = document.createElement("td");
    r1.innerText = td1;
    r2.innerText = td2;
    r3.innerText = td3;
    r4.innerText = count;
    row.append(r4, r1, r2, r3);
    tbody.append(row);
    count++;
  }
  // Show table if workflows are present
  table.style.display = data.length > 0 ? "block" : "none";
  msg.style.display = "none";
}

// ###################  Download the Workflow Name, object_type, and group_name in Excel format.    #######################

function downloadExcel() {
  if (data.length === 0) {
    alert("Please parse an XML file first.");
    return;
  }

  /* Create worksheet data */
  let wsData = [["Workflow Name", "Object type", "Group Name"]];
  for (let i = 0; i < data.length; i++) {
    wsData.push([data[i][0], data[i][1], data[i][2]]);
  }

  Excel(wsData, "workflow");
}

//   ***************************  Making Condition using Object_type and group_name  *****************************

function DownloadCondition() {
  for (let key in objectData) {
    let object_type = objectData[key].object_type;
    let groups = objectData[key].group;
    let objectConcate = "";
    let group_concate = "";
    for (let i = 0; i < object_type.length; i++) {
      if (i === 0) {
        objectConcate += `wo.object_type="${object_type[i]}"`;
      } else {
        objectConcate += ` OR wo.object_type="${object_type[i]}"`;
      }
    }
    for (let i = 0; i < groups.length; i++) {
      if (i === 0) {
        group_concate += `us.group_name="${groups[i]}"`;
      } else {
        group_concate += ` OR us.group_name="${groups[i]}"`;
      }
    }
    let res = `(${objectConcate}) AND (${group_concate})`;
    data2.push([key, res]);
  }

  CreatingConditionExcel(data2);
}

function CreatingConditionExcel(data2) {
  if (data2.length === 0) {
    alert("Please parse an XML file first.");
    return;
  }

  /* Create worksheet data */
  let wsData = [["Workflow Name", "Condition"]];
  for (let el of data2) {
    wsData.push([el[0], el[1]]);
  }

  /* Create a worksheet */
  Excel(wsData, "workflowCondition");
}

// ******************************************  Creating XML for Condtion *****************************

function generateXMLConditions() {
  let count=1;
  const objdata = Object.values(FilterData(objectData));

  let wsData = [["Workflow Name", "Condition Name", "Condition XML"]];
  let xmlOutput = `<?xml version="1.0" encoding="UTF-8"?>\n<Root>\n`;
  if (data.length === 0) {
    alert("Please parse an XML file first.");
    return;
  }
  let prefixName = window.prompt("Please enter your prefix Name like G5_");
  let lastChar = prefixName[prefixName.length - 1];
  if (lastChar != "_") {
    prefixName += "_";
  }

  for (let key in objdata) {
    let cleanName = objdata[key].SameWorkflowCondtion[0]
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, ""); // Remove special characters from name
    const objectTypes = objdata[key].object_type
      .map((type) => `wo.object_type=&quot;${type}&quot;`)
      .join(" OR ");
    const groups = objdata[key].group
      .map((group) => `us.group_name=&quot;${group}&quot;`)
      .join(" OR ");

    let desc = [...objdata[key].SameWorkflowCondtion];
    let f = desc.slice(-2).join(" and ");
    if (objdata[key].SameWorkflowCondtion.length > 1) {
      cleanName=`COMMON_CND${count++}`
      desc = objdata[key].SameWorkflowCondtion.slice(
        0,
        objdata[key].SameWorkflowCondtion.length - 2
      );
      desc.push(f);
    }

    let p = `  <Condition name="${prefixName}WF_${cleanName}" expression="(${objectTypes}) AND (${groups})" secured="false" description="Workflow condition for ${desc.join(
      ", "
    )}">
     <ConditionParameter name="wo" parameterTypeName="WorkspaceObject"/>
     <ConditionParameter name="it" parameterTypeName="ImanType"/>
     <ConditionParameter name="us" parameterTypeName="UserSession"/>
  </Condition>`;

    wsData.push([
      objdata[key].SameWorkflowCondtion.join("     \n"),
      `${prefixName}WF_${cleanName}`,
      p,
    ]);

    xmlOutput += `${p}\n`;
  }
  xmlOutput += `</Root>`;
  Excel(wsData, "Condtion_as_XML");
  setTimeout(() => {
    XML(xmlOutput);
  }, 5000);
}

// ******************** Creating Excel ***************************************************
function Excel(wsData, name) {
  /* Create a worksheet */
  let ws = XLSX.utils.aoa_to_sheet(wsData);

  /* Create a workbook with a single sheet */
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");

  /* Convert workbook to data URI */
  let dataUri = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  /* Create download link */
  let link = document.createElement("a");
  link.href =
    "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," +
    dataUri;
  link.download = `${name}.xlsx`;

  /* Simulate a click on the link to trigger the download */
  link.click();
}

function XML(existingXML) {
  const xmlBlob = new Blob([existingXML], { type: "application/xml" });

  // Create a download link
  const downloadLink = document.createElement("a");
  downloadLink.href = window.URL.createObjectURL(xmlBlob);
  downloadLink.download = "conditions.xml";

  // Trigger the download
  downloadLink.click();
}

// **********************************************************************
function FilterData(data) {
  const groupedData = {};

  // Iterate over each key in the data object
  Object.keys(data).forEach((key) => {
    // Get the current object
    const currentItem = data[key];

    // Generate a unique key based on the group and object_type arrays
    const groupKey =
      JSON.stringify(currentItem.group.sort()) +
      JSON.stringify(currentItem.object_type.sort());

    // Check if the key exists in the groupedData object
    if (!groupedData[groupKey]) {
      // If the key doesn't exist, initialize it with an empty array
      groupedData[groupKey] = {
        object_type: currentItem.object_type,
        group: currentItem.group,
        SameWorkflowCondtion: [],
      };
    }

    // Push the current key into the list of the corresponding group key
    groupedData[groupKey].SameWorkflowCondtion.push(key);
  });

  return groupedData;
}

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  Encoding DropDown   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const encodingList = [
  {
    name: "UTF-8",
    description: "UTF-8 (Unicode Transformation Format - 8-bit)",
  },
  { name: "ISO-8859-1", description: "ISO 8859-1 (Latin-1 Western European)" },
  { name: "ISO-8859-2", description: "ISO 8859-2 (Latin-2 Central European)" },
  { name: "ISO-8859-3", description: "ISO 8859-3 (Latin-3 South European)" },
  { name: "ISO-8859-4", description: "ISO 8859-4 (Latin-4 North European)" },
  { name: "ISO-8859-5", description: "ISO 8859-5 (Latin/Cyrillic)" },
  { name: "ISO-8859-6", description: "ISO 8859-6 (Latin/Arabic)" },
  { name: "ISO-8859-7", description: "ISO 8859-7 (Latin/Greek)" },
  { name: "ISO-8859-8", description: "ISO 8859-8 (Latin/Hebrew)" },
  { name: "ISO-8859-9", description: "ISO 8859-9 (Latin-5 Turkish)" },
  { name: "ISO-8859-10", description: "ISO 8859-10 (Latin-6 Nordic)" },
  { name: "windows-1250", description: "Windows-1250 (Central European)" },
  { name: "windows-1251", description: "Windows-1251 (Cyrillic)" },
  { name: "windows-1252", description: "Windows-1252 (Western European)" },
  { name: "windows-1253", description: "Windows-1253 (Greek)" },
  { name: "windows-1254", description: "Windows-1254 (Turkish)" },
  { name: "windows-1255", description: "Windows-1255 (Hebrew)" },
  { name: "windows-1256", description: "Windows-1256 (Arabic)" },
  { name: "windows-1257", description: "Windows-1257 (Baltic Rim)" },
  { name: "windows-1258", description: "Windows-1258 (Vietnamese)" },
  // Add more encodings as needed
];
// rendering the options  in select tag

encodingList.forEach((encoding) => {
  const option = document.createElement("option");
  option.value = encoding.name;
  option.textContent = `${encoding.name} - ${encoding.description}`;
  encodingSelect.appendChild(option);
});

function EncodingCharSet() {
  return encodingSelect.value;
}

console.log({ EN: encodingSelect.value });
