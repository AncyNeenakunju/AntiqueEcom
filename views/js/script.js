const categoryDropdown = document.getElementById("categorySelect");
const subcategoryDropdown = document.getElementById("subcategorySelect");
categoryDropdown.addEventListener("change", function() {
  const selectedCategory = categoryDropdown.value;
  console.log(selectedCategory)
  // Call a function to fetch subcategories based on the selected category
  fetchSubcategories(selectedCategory);
});

function populateSubcategoryDropdown(subcategories) {
  // Clear existing options
  subcategoryDropdown.innerHTML = "";

  if (subcategories.length === 0) {
    // If there are no subcategories, display a message or placeholder option
    const placeholderOption = document.createElement("option");
    placeholderOption.text = "No subcategories available";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    subcategoryDropdown.appendChild(placeholderOption);
  } else {
    // Create and add new options based on the received subcategories
    subcategories.forEach(subcategory => {
      const option = document.createElement("option");
      option.value = subcategory;
      option.text = subcategory;
      subcategoryDropdown.appendChild(option);
    });
  }
}

function fetchSubcategories(selectedCategory) {
  fetch(`admin/subcategories?category=${selectedCategory}`)
    .then(response => response.json())
    .then(data => {
      // Handle the received subcategories data here
      console.log(data)
      populateSubcategoryDropdown(data.subcategory);
    })
    .catch(error => {
      console.error("Error fetching subcategories:", error);
    });
}


/*document.getElementById("sortDropdown").addEventListener("change", function () {
  const selectedValue = this.value;

  // Send an AJAX request to the server with the selected value
  fetch("http://localhost:3000/api/v1/users/productlists", {
    method: "POST",
    body: JSON.stringify({ sortBy: selectedValue }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Update the content in the "resultsContainer" with the sorted results
      document.getElementById("resultsContainer").innerHTML = data.results;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});


document.getElementById("sortDropdown").addEventListener("change", function () {
  const selectedValue = this.value;
alert("hi")
  // Send an AJAX request to the server with the selected value
  fetch(`http://localhost:3000/api/v1/users/productlists?sortBy=${selectedValue}`)
    .then((response) => response.json())
    .then((data) => {
      // Update the content in the "resultsContainer" with the sorted results
      document.getElementById("resultsContainer").innerHTML = data.results;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
*/

