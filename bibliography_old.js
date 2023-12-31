const PUBLICATIONS_PER_PAGE = 25;
let publicationsData = [];
let currentPage = 1;
let currentInfoBoxContent = ""; // Add this line

window.onload = function () {
  fetch("aksw.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
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
          currentPage = 1;
          updateDOM();
        });

        let label = document.createElement("label");
        label.htmlFor = "year" + year;
        label.appendChild(document.createTextNode(year));

        yearFilter.appendChild(checkbox);
        yearFilter.appendChild(label);
        yearFilter.appendChild(document.createElement("br"));
      });
      // Generate checkboxes for each author
      let authors = Array.from(
        new Set(
          publicationsData.flatMap((item) =>
            item.authors ? item.authors.map((author) => {
              let fullName = author.first + " " + author.last;
              return fullName.replace(/(^|\s)and /i, "");
            }) : []
          )
        )
      );
      authors.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

      let authorFilter = document.getElementById("authorFilter");
      authors.forEach((author) => {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "author" + author.replace(/ /g, "");
        checkbox.value = author;

        checkbox.addEventListener("change", function () {
          currentPage = 1;
          updateDOM();
        });

        let label = document.createElement("label");
        label.htmlFor = "author" + author.replace(/ /g, "");
        label.appendChild(document.createTextNode(author));

        authorFilter.appendChild(checkbox);
        authorFilter.appendChild(label);
        authorFilter.appendChild(document.createElement("br"));
      });

      updateDOM();
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });

  document.getElementById("textFilter").addEventListener("input", function (e) {
    currentPage = 1;
    updateDOM();
  });

  document.getElementById("sort").addEventListener("change", function () {
    currentPage = 1;
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

function toggleAuthorFilter() {
  var authorFilter = document.getElementById("authorFilter");
  if (authorFilter.style.display === "none") {
    authorFilter.style.display = "block";
  } else {
    authorFilter.style.display = "none";
  }
}

function changePage(page) {
  currentPage = page;
  updateDOM();
}

function createInfoBox(content) {
  console.log("Creating info box with content: ", content);
  let infoBox = document.createElement("div");
  infoBox.className = "info-box";
  infoBox.innerText = content; // Use innerText instead of textContent
  return infoBox;
}

function toggleInfoBox(publicationDiv, infoBox) {
  console.log("toggleInfoBox called");
  // Remove any existing info box
  let existingInfoBoxes = publicationDiv.querySelectorAll(".info-box");
  existingInfoBoxes.forEach((box) => publicationDiv.removeChild(box));

  // Check if the new info box content is the same as the current one
  if (currentInfoBoxContent === infoBox.innerText) {
    // If it is, clear currentInfoBoxContent so it won't be added again
    currentInfoBoxContent = "";
  } else {
    // If it's not, update currentInfoBoxContent and add the new info box
    currentInfoBoxContent = infoBox.innerText;
    console.log("Adding new info box");
    publicationDiv.appendChild(infoBox);
  }
}

function updateDOM() {
  let container = document.getElementById("publications");
  container.innerHTML = "";

  // Get the checked years
  let checkedYears = Array.from(
    document.querySelectorAll("#yearFilter input:checked")
  ).map((checkbox) => Number(checkbox.value));

  // Get the checked authors
  let checkedAuthors = Array.from(
    document.querySelectorAll("#authorFilter input:checked")
  ).map((checkbox) => checkbox.value);

  // Get the filter text
  let filterText = document.getElementById("textFilter").value;

  // Filter publications
  let filteredPublications = publicationsData.filter((publication) => {
    let publicationYear = Number(publication.year);
    let publicationAuthors = publication.authors ? publication.authors.map((author) => author.first + " " + author.last) : [];
    if (checkedYears.length > 0 && !checkedYears.includes(publicationYear)) {
      return false;
    }

    if (checkedAuthors.length > 0 && !publicationAuthors.some(author => checkedAuthors.includes(author))) {
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

  let start = (currentPage - 1) * PUBLICATIONS_PER_PAGE;
  let end = start + PUBLICATIONS_PER_PAGE;
  let paginatedPublications = filteredPublications.slice(start, end);

  // Display filtered and sorted publications
  paginatedPublications.forEach((publication) => {
    let div = document.createElement("div");
    div.className = "publication";

    let title = document.createElement("h2");
    title.textContent = publication.label;
    div.appendChild(title);

    let authors = document.createElement("p");
    if (publication.authors) {
      authors.textContent =
        "" +
        publication.authors.map((a) => a.first + " " + a.last).join(", ");
    } else {
      authors.textContent = "Authors: N/A";
    }
    div.appendChild(authors);

    let year = document.createElement("p");
    year.textContent = "" + publication.year;
    div.appendChild(year);

    // Create info button
    let infoButton = document.createElement("a");
    infoButton.className = "url-button";
    infoButton.textContent = "BIB";
    // Add event listener to info button to display bibtex when clicked
    infoButton.addEventListener("click", function () {
      console.log("BIB button clicked");
      let bibtex = jsonToBibtex(publication);
      let infoBox = createInfoBox(bibtex);
      toggleInfoBox(div, infoBox);
    });
    div.appendChild(infoButton);

    // Check if publication has a URL and create a button for it
    if (publication.url) {
      let urlButton = document.createElement("a");
      urlButton.href = publication.url;
      urlButton.textContent = "PDF";
      urlButton.className = "url-button";
      div.appendChild(urlButton);
    }
    // Check if publication has an abstract and create a button for it
    if (publication.abstract) {
      let abstractButton = document.createElement("a");
      abstractButton.textContent = "ABS";
      abstractButton.className = "url-button";
      abstractButton.addEventListener("click", function () {
        console.log("ABS button clicked");
        let infoBox = createInfoBox(publication.abstract);
        toggleInfoBox(div, infoBox);
      });
      div.appendChild(abstractButton);
    }

    // Check if publication has an ID and create a button for it
    if (publication.id) {
      let urlButton = document.createElement("a");
      urlButton.href = publication.id;
      urlButton.textContent = "URL";
      urlButton.className = "url-button";
      div.appendChild(urlButton);
    }

    container.appendChild(div);
  });

  let totalPages = Math.ceil(
    filteredPublications.length / PUBLICATIONS_PER_PAGE
  );

  // Create a div for pagination buttons
  let paginationDiv = document.createElement("div");
  paginationDiv.style.textAlign = "center"; // Center the buttons

  // Create a button for the first page
  if (currentPage > 2) {
    let firstPageButton = document.createElement("button");
    firstPageButton.textContent = 1;
    firstPageButton.className = "btn btn-secondary mr-2"; // Add margin to the right
    firstPageButton.addEventListener("click", function () {
      changePage(1);
      window.scrollTo(0, document.body.scrollHeight);
    });
    paginationDiv.appendChild(firstPageButton);
  }

  // Create a button for the previous page
  if (currentPage > 1) {
    let previousPageButton = document.createElement("button");
    previousPageButton.textContent = currentPage - 1;
    previousPageButton.className = "btn btn-secondary mr-2"; // Add margin to the right
    previousPageButton.addEventListener("click", function () {
      changePage(currentPage - 1);
      window.scrollTo(0, document.body.scrollHeight);
    });
    paginationDiv.appendChild(previousPageButton);
  }

  // Create a button for the current page
  let currentPageButton = document.createElement("button");
  currentPageButton.textContent = currentPage;
  currentPageButton.className = "btn btn-primary mr-2"; // Add margin to the right
  paginationDiv.appendChild(currentPageButton);

  // Create a button for the next page
  if (currentPage < totalPages) {
    let nextPageButton = document.createElement("button");
    nextPageButton.textContent = currentPage + 1;
    nextPageButton.className = "btn btn-secondary mr-2"; // Add margin to the right
    nextPageButton.addEventListener("click", function () {
      changePage(currentPage + 1);
      window.scrollTo(0, document.body.scrollHeight);
    });
    paginationDiv.appendChild(nextPageButton);
  }

  // Create a button for the last page
  if (currentPage < totalPages - 1) {
    let lastPageButton = document.createElement("button");
    lastPageButton.textContent = totalPages;
    lastPageButton.className = "btn btn-secondary mr-2"; // Add margin to the right
    lastPageButton.addEventListener("click", function () {
      changePage(totalPages);
      window.scrollTo(0, document.body.scrollHeight);
    });
    paginationDiv.appendChild(lastPageButton);
  }

  // Append the pagination div to the container
  container.appendChild(paginationDiv);

  document.getElementById("counter").textContent =
    "Number of publications: " + filteredPublications.length;
}
