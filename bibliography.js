let publicationsData = [];

window.onload = function () {
  fetch("aksw.json")
    .then((response) => response.json())
    .then((data) => {
      publicationsData = data.items.filter(
        (item) => item.type === "Publication"
      );

      // Generate checkboxes for each year
      let years = Array.from(
        new Set(publicationsData.map((item) => item.year))
      );
      years.sort((a, b) => b - a); // Sort years in descending order

      let yearFilter = document.getElementById("yearFilter");
      years.forEach((year) => {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "year" + year;
        checkbox.value = year;

        checkbox.addEventListener("change", function () {
          updateDOM();
        });

        let label = document.createElement("label");
        label.htmlFor = "year" + year;
        label.appendChild(document.createTextNode(year));

        yearFilter.appendChild(checkbox);
        yearFilter.appendChild(label);
        yearFilter.appendChild(document.createElement("br"));
      });

      updateDOM();
    });

  document.getElementById("textFilter").addEventListener("input", function (e) {
    updateDOM();
  });

  document.getElementById("sort").addEventListener("change", function () {
    let arrow = document.getElementById("arrow");
    let sortLabel = document.getElementById("sortLabel"); // Get the label element
    if (this.checked) {
      arrow.textContent = "↑";
      sortLabel.innerHTML = '<span id="arrow">↑</span> Ascending'; // Set the label text to "Ascending" when checked
    } else {
      arrow.textContent = "↓";
      sortLabel.innerHTML = '<span id="arrow">↓</span> Descending'; // Set the label text to "Descending" when not checked
    }
    updateDOM();
  });
};

function jsonToBibtex(json) {
  let bibtex = "@" + json["pub-type"] + "{" + json["bibtexKey"] + ",\n";
  for (let key in json) {
    if (key !== "pub-type" && key !== "bibtexKey") {
      bibtex += "  " + key + " = {" + json[key] + "},\n";
    }
  }
  bibtex += "}";
  return bibtex;
}

function toggleYearFilter() {
  var yearFilter = document.getElementById("yearFilter");
  if (yearFilter.style.display === "none") {
    yearFilter.style.display = "block";
  } else {
    yearFilter.style.display = "none";
  }
}

function updateDOM() {
  let container = document.getElementById("publications");
  container.innerHTML = "";

  // Get the checked years
  let checkedYears = Array.from(
    document.querySelectorAll("#yearFilter input:checked")
  ).map((checkbox) => Number(checkbox.value));

  // Get the filter text
  let filterText = document.getElementById("textFilter").value;

  // Filter publications
  let filteredPublications = publicationsData.filter((publication) => {
    let publicationYear = Number(publication.year);
    if (checkedYears.length > 0 && !checkedYears.includes(publicationYear)) {
      return false;
    }
    if (filterText) {
      const publicationValues = Object.values(publication).flat();
      if (
        !publicationValues.some((value) =>
          value.toString().toLowerCase().includes(filterText.toLowerCase())
        )
      ) {
        return false;
      }
    }
    return true;
  });

  // Determine sort order
  let sortOrder = document.getElementById("sort").checked ? "asc" : "desc";
  // Sort filtered publications
  filteredPublications.sort((a, b) => {
    return sortOrder === "asc" ? a.year - b.year : b.year - a.year;
  });

  // Display filtered and sorted publications
  filteredPublications.forEach((publication) => {
    let div = document.createElement("div");
    div.className = "publication";

    let title = document.createElement("h2");
    title.textContent = publication.label;
    div.appendChild(title);

    let authors = document.createElement("p");
    if (publication.authors) {
      authors.textContent =
        "Authors: " +
        publication.authors.map((a) => a.first + " " + a.last).join(", ");
    } else {
      authors.textContent = "Authors: N/A";
    }
    div.appendChild(authors);

    let year = document.createElement("p");
    year.textContent = "Year: " + publication.year;
    div.appendChild(year);

    // Create info button
    let infoButton = document.createElement("i");
    infoButton.className = "info-button";
    infoButton.textContent = '"';
    infoButton.addEventListener("click", function () {
      let bibtex = jsonToBibtex(publication);
      document.getElementById("infoData").textContent = bibtex;
      document.getElementById("infoModal").style.display = "block";
    });
    div.appendChild(infoButton);

    // When the user clicks on <span> (x), close the modal
    document.getElementsByClassName("close")[0].onclick = function () {
      document.getElementById("infoModal").style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == document.getElementById("infoModal")) {
        document.getElementById("infoModal").style.display = "none";
      }
    };
    container.appendChild(div);
  });
  document.getElementById("counter").textContent =
    "Number of publications: " + filteredPublications.length;
}
