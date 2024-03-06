let objectData = {};
let data = [];
let filenames = [];
let data2 = [];
let cl = 0;
let One_on_one_count = 0;
let conditionCreate = false;
let Condition_as_xml_count = 0;
let prefixName;

const encodingSelect = document.getElementById("encodingSelect");
// Hiding table before parsing
let table = document.getElementById("result");
table.style.display = "none";

// Function to parse XML
function parseXML() {
  let fileInput = document.getElementById("fileInput");
  data = [];
  One_on_one_count = 0;
  Condition_as_xml_count = 0;
  objectData = {};

  if (fileInput.files.length > 0) {
    filenames = Array.from(fileInput.files);
    for (let file of filenames) {
      parseFile(file);
    }
    table.style.width = "60%";
    encodingSelect.style.display = "block";
    document.getElementById("encoding").style.display = "block";
    document.getElementById("encoding").style.width = "20%";
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
    let encodingCharSet = encodingSelect.value;
    let textDecoder = new TextDecoder(encodingCharSet); // can be use UTF-8 or anything as per encoding require
    xmlString = textDecoder.decode(new Uint8Array(e.target.result));
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xmlString, "text/xml");
    let preferences = xmlDoc.querySelectorAll("preference");
    parsePreferences(preferences, groupName);
    displayTable(data);
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
    let p1 = preferences[i].getAttribute("name").split("_release_procedure").length;
    // let p2 = name?.split("BCT4_").length;
    // let p3 = name?.split("Revision").length;


    let values = preferences[i].querySelectorAll(
      'context[name="Teamcenter"] > value'
    );

    for (let j = 0; j < values.length; j++) {
      let el = values[j].textContent.split("Unterprozess");
      if (el.length < 2 && (p1>=2)) {
        let valueText = values[j].textContent.trim();
        data.push({ workflow: valueText, object_type: name, group: groupName });
        updateObjectData(valueText, name, groupName);
        count++;
      }
    }
  }
}

// Function to update objectData
function updateObjectData(workflow, object_type, group) {
  if (!objectData[workflow]) {
    objectData[workflow] = [{ object_type, group }];
  } else {
    if (!objectData[workflow].includes({ object_type, group })) {
      objectData[workflow].push({ object_type, group });
    }
  }
}

// Function to display table
function displayTable(data) {
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
    let r1 = document.createElement("td");
    let r2 = document.createElement("td");
    let r3 = document.createElement("td");
    let r4 = document.createElement("td");
    r1.innerText = item.workflow;
    r2.innerText = item.object_type ? item.object_type : item.condition_name;
    r3.innerText = item.group ? item.group : item.condition;
    r4.innerText = count;
    row.append(r4, r1, r2, r3);
    tbody.append(row);
    count++;
  }
  // Show table if workflows are present
  table.style.display = data.length > 0 ? "block" : "none";
  msg.style.display = "none";
}

//   ***************************  Making Condition using Object_type and group_name  *****************************
let click = false;
function One_on_one() {
  data2 = [];
  prefixName = Prefix(prefixName);

  for (let key in objectData) {
    let Condtion_Concate = "";
    let Uniquegroup = [];
    let object_type = objectData[key];

    CondtionMaker(object_type, Uniquegroup, Condtion_Concate, key, data2);
  }
  TableRowNameChange("CONDITION NAME", "CONDITION");
  displayTable(data2);

  
}

function CondtionMaker(object_type, Uniquegroup, Condtion_Concate, key, data2) {
  for (let el of object_type) {
    if (!Uniquegroup.includes(el.group)) {
      Uniquegroup.push(el.group);
    }
  }
  if (Uniquegroup.length <= 1) {
    for (let i = 0; i < object_type.length; i++) {
      if (i === 0) {
        Condtion_Concate += `(wo.object_type="${object_type[i].object_type}"`;
      }
       else {
        Condtion_Concate += ` OR wo.object_type="${object_type[i].object_type}"`;
      }
    }
    let group = ` AND (us.group_name="${Uniquegroup[0]}"`;
    Condtion_Concate = `(${Condtion_Concate})${
      Uniquegroup[0] === "site" ? "" : group
    })`;
  } else {
    for (let i = 0; i < object_type.length; i++) {
      if (i === 0) {
        if (object_type[i].group == "site") {
          Condtion_Concate += `(wo.object_type="${object_type[i].object_type}")`;
        } else
          Condtion_Concate += `(wo.object_type="${object_type[i].object_type}" AND us.group_name="${object_type[i].group}")`;
      } else {
        if (object_type[i].group === "site") {
          Condtion_Concate += ` OR (wo.object_type="${object_type[i].object_type}")`;
        } else {
          Condtion_Concate += ` OR (wo.object_type="${object_type[i].object_type}" AND us.group_name="${object_type[i].group}")`;
        }
      }
    }
  }
  data2.push({
    workflow: key,
    condition_name: `${prefixName}${trim(key)}`,
    condition: Condtion_Concate,
  });
}

// ******************************************  Creating XML for Condtion *****************************



function CondtionMaker(object_type, Uniquegroup, Condtion_Concate, key, data2) {
    for (let el of object_type) {
      if (!Uniquegroup.includes(el.group)) {
        Uniquegroup.push(el.group);
      }
    }
    for (let i = 0; i < object_type.length; i++){
        if (Uniquegroup.length <= 1) {
            if (i === 0) {
                Condtion_Concate += `wo.object_type="${object_type[i].object_type}"`;
              } else {
                Condtion_Concate += ` OR wo.object_type="${object_type[i].object_type}"`;
              }

        }
        else{
            if (i === 0) {
                if (object_type[i].group == "site") {
                  Condtion_Concate += `(wo.object_type="${object_type[i].object_type}")`;
                } else
                  Condtion_Concate += `(wo.object_type="${object_type[i].object_type}" AND us.group_name="${object_type[i].group}")`;
              } else {
                if (object_type[i].group === "site") {
                  Condtion_Concate += ` OR (wo.object_type="${object_type[i].object_type}")`;
                } else {
                  Condtion_Concate += ` OR (wo.object_type="${object_type[i].object_type}" AND us.group_name="${object_type[i].group}")`;
                }
              }

        }

    }
    data2.push({
        workflow: key,
        condition_name: `${prefixName}${trim(key)}`,
        condition: Condtion_Concate,
      });
     
  }

function generateXMLConditions() {
  if (data.length === 0) {
    alert("Please parse an XML file first.");
    return;
  }

  organizedData = [];
  FormatData(prefixName);
  prefixName = Prefix(prefixName);

  const wsData = [["Workflow Name", "Condition Name", "Condition XML"]];
  let xmlOutput = `<?xml version="1.0" encoding="UTF-8"?>\n<Root>\n`;
  let count = 1;

  for (const elem of organizedData) {
    const cheker = [];
    const concateArr = [];

    elem.objects.forEach((el) => {
      if (!cheker.includes(el.group)) {
        cheker.push(el.group);
      }
      concateArr.push(
        el.group === "site"
          ? `(wo.object_type=&quot;${el.object_type}&quot;)`
          : `(wo.object_type=&quot;${el.object_type}&quot; AND us.group_name=&quot;${el.group}&quot;)`
      );
    });

    let concate = concateArr.join(" OR ");
    if (cheker.length > 1) {
      concate = `(${concate})`;
    } else if (cheker.length === 1 && cheker[0] !== "site") {
      concate += ` AND (us.group_name=&quot;${cheker[0]}&quot;)`;
    }

    let cleanName = trim(elem.workflow[0]);
    let desc = [...elem.workflow];
    let f = desc.slice(-2).join(" and ");
    if (elem.workflow.length > 1) {
      cleanName = `COMMON_CND${count++}`;
      desc = elem.workflow.slice(0, elem.workflow.length - 2);
      desc.push(f);
    }

    const p = `  <Condition name="${prefixName}WF_${cleanName}" expression="${concate}" secured="false" description="Workflow condition for ${desc.join(
      ", "
    )}">
    <ConditionParameter name="wo" parameterTypeName="WorkspaceObject"/>
    <ConditionParameter name="it" parameterTypeName="ImanType"/>
    <ConditionParameter name="us" parameterTypeName="UserSession"/>
    </Condition>`;

    wsData.push({
      workflow: elem.workflow.join("     \n"),
      condition_name: `${prefixName}WF_${cleanName}`,
      condition: p,
    });
    xmlOutput += `${p}\n`;
  }

  xmlOutput += `</Root>`;
  TableRowNameChange("Condition Name", "Condition as XML");
  displayTable(wsData.slice(1, wsData.length));

  if (Condition_as_xml_count === 0) {
    XML(xmlOutput);
    Condition_as_xml_count++;
  }
}

// *************************************** Updater function for organized Data ***********************
function FormatData(prefixName) {
  for (const [workflow, objects] of Object.entries(objectData)) {
    const existingEntry = organizedData.find(
      (entry) =>
        entry.objects.length === objects.length &&
        entry.objects.every((obj) =>
          objects.some(
            (o) => o.object_type === obj.object_type && o.group === obj.group
          )
        ) &&
        objects.every((obj) =>
          entry.objects.some(
            (o) => o.object_type === obj.object_type && o.group === obj.group
          )
        )
    );

    if (existingEntry) {
      existingEntry.workflow.push(workflow);
    } else {
      organizedData.push({ workflow: [workflow], objects });
    }
  }
}

// *********************************** Create xml file and trigger to download ***********************************

function XML(existingXML) {
  const xmlBlob = new Blob([existingXML], { type: "application/xml" });

  // Create a download link
  const downloadLink = document.createElement("a");
  downloadLink.href = window.URL.createObjectURL(xmlBlob);
  downloadLink.download = `${prefixName}_ALL_CONDITIONS`;

  // Trigger the download
  downloadLink.click();
}

// // **********************************************************************

// // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  Encoding DropDown   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const encodingList = [
  { name: "windows-1252", description: "Windows-1252 (Western European)" },
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
  option.textContent = `${encoding.description}`;
  encodingSelect.appendChild(option);
});

function EncodingCharSet() {
  cl++;
  // displayTable()
  if (data.length !== 0) {
    parseXML();
  }
  return encodingSelect.value;
}

// // *************** Changing the table header name *****************************************
function TableRowNameChange(n1, n2) {
  let selectTag = document.getElementById("encoding");
  let th1 = document.getElementById("tho");
  let th2 = document.getElementById("thg");
  conditionCreate = true;

  th1.innerText = n1;
  th2.innerText = n2;
  table.style.width = "90%";
  selectTag.style.width = "9.5%";
  selectTag.style.display = "none";
}

// //  Removing all the special character, white space ,paranthesis etc.
function trim(name) {
  return name
    .replace(/[ü]/g, "ue")
    .replace(/[Ü]/g, "Ue")
    .replace(/[ö]/g, "oe")
    .replace(/[Ö]/g, "Oe")
    .replace(/[ä]/g, "ae")
    .replace(/[Ä]/g, "Ae")
    .replace(/[ß]/g, "ss")
    .replace(/[Ã¼]/g, "Ue")
    .replace(/[.,\/()\\=>-]/g, "")
    .replace(/^[a-zA-Z]+(_[a-zA-Z]+)*$/, "")
    .replace(/\s+/g, "_");
}

function Prefix(prefixName) {
  if (!prefixName) {
    prefixName = window.prompt("Please enter your prefix Name like G5_ or G5");
    let last = prefixName[prefixName.length - 1];
    if (last != "_") {
      prefixName += "_";
    }
  }
  return prefixName;
}
