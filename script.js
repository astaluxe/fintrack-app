const STORAGE_KEY =
  "fintrack-transactions-v1";


let transactions =
  JSON.parse(
    localStorage.getItem(STORAGE_KEY)
  ) || [];


let currentType =
  "expense";


let editingId =
  null;



// ========================================
// ELEMENTOS
// ========================================

const form =
  document.getElementById("transactionForm");

const formTitle =
  document.getElementById("formTitle");

const submitButton =
  document.getElementById("submitButton");

const cancelEdit =
  document.getElementById("cancelEdit");

const descriptionInput =
  document.getElementById("description");

const amountInput =
  document.getElementById("amount");

const categoryInput =
  document.getElementById("category");

const dateInput =
  document.getElementById("date");

const transactionList =
  document.getElementById("transactionList");

const emptyState =
  document.getElementById("emptyState");

const countOutput =
  document.getElementById("transactionCount");

const balanceOutput =
  document.getElementById("balanceValue");

const incomeOutput =
  document.getElementById("incomeValue");

const expenseOutput =
  document.getElementById("expenseValue");

const savingOutput =
  document.getElementById("savingValue");

const typeButtons =
  document.querySelectorAll(".type-button");

const searchInput =
  document.getElementById("searchInput");

const typeFilter =
  document.getElementById("typeFilter");

const categoryFilter =
  document.getElementById("categoryFilter");

const demoButton =
  document.getElementById("demoButton");

const categoryChart =
  document.getElementById("categoryChart");

const categoryEmpty =
  document.getElementById("categoryEmpty");

const topCategoryIcon =
  document.getElementById("topCategoryIcon");

const topCategoryName =
  document.getElementById("topCategoryName");

const topCategoryAmount =
  document.getElementById("topCategoryAmount");

const expenseCount =
  document.getElementById("expenseCount");

const averageExpense =
  document.getElementById("averageExpense");

const toast =
  document.getElementById("toast");



// ========================================
// FECHA
// ========================================

function today() {

  return new Date()
    .toISOString()
    .split("T")[0];

}

dateInput.value =
  today();



// ========================================
// EURO
// ========================================

const euro =
  new Intl.NumberFormat(
    "es-ES",
    {
      style: "currency",
      currency: "EUR"
    }
  );



// ========================================
// GUARDAR
// ========================================

function saveTransactions() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions)
  );

}



// ========================================
// TOAST
// ========================================

function showToast(text) {

  toast.textContent =
    text;

  toast.classList.add("show");

  setTimeout(
    () => {

      toast.classList.remove("show");

    },
    1800
  );

}



// ========================================
// ICONOS
// ========================================

function categoryIcon(category) {

  const icons = {

    Comida: "🍔",
    Transporte: "🚗",
    Compras: "🛍️",
    Ocio: "🎮",
    Estudios: "📚",
    Salud: "❤️",
    Ingresos: "💰",
    Otros: "📦"

  };

  return icons[category] || "📦";

}



// ========================================
// FECHA FORMATEADA
// ========================================

function formatDate(dateString) {

  const date =
    new Date(
      dateString +
      "T00:00:00"
    );

  return date.toLocaleDateString(
    "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}



// ========================================
// RESUMEN
// ========================================

function updateSummary() {

  const income =
    transactions
      .filter(
        transaction =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );


  const expenses =
    transactions
      .filter(
        transaction =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );


  const balance =
    income - expenses;


  const savingRate =
    income > 0
      ?
      (
        (
          income - expenses
        ) /
        income
      ) * 100
      :
      0;


  balanceOutput.textContent =
    euro.format(balance);


  incomeOutput.textContent =
    euro.format(income);


  expenseOutput.textContent =
    euro.format(expenses);


  savingOutput.textContent =
    Math.round(savingRate)
    +
    " %";

}



// ========================================
// ESTADÍSTICAS CATEGORÍAS
// ========================================

function updateCategoryAnalytics() {

  const expenses =
    transactions.filter(
      transaction =>
        transaction.type === "expense"
    );


  const totalExpenses =
    expenses.reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );


  const categories =
    {};


  expenses.forEach(
    transaction => {

      if (
        !categories[
          transaction.category
        ]
      ) {

        categories[
          transaction.category
        ] = 0;

      }


      categories[
        transaction.category
      ] +=
        transaction.amount;

    }
  );


  const sorted =
    Object.entries(categories)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  categoryChart.innerHTML =
    "";


  categoryEmpty.style.display =
    sorted.length
      ? "none"
      : "block";


  sorted.forEach(
    ([category, amount]) => {

      const percentage =
        totalExpenses > 0
          ?
          (
            amount /
            totalExpenses
          ) * 100
          :
          0;


      const row =
        document.createElement("div");


      row.className =
        "category-row";


      row.innerHTML = `

        <div class="category-name">

          ${categoryIcon(category)}
          ${category}

        </div>

        <div class="category-track">

          <div
            class="category-fill"
            style="width:${percentage}%"
          >
          </div>

        </div>

        <div class="category-amount">

          ${euro.format(amount)}

        </div>

      `;


      categoryChart
        .appendChild(row);

    }
  );



  if (sorted.length) {

    const [category, amount] =
      sorted[0];


    topCategoryIcon.textContent =
      categoryIcon(category);


    topCategoryName.textContent =
      category;


    topCategoryAmount.textContent =
      euro.format(amount);

  }

  else {

    topCategoryIcon.textContent =
      "—";


    topCategoryName.textContent =
      "Sin datos";


    topCategoryAmount.textContent =
      euro.format(0);

  }



  expenseCount.textContent =
    expenses.length;



  const average =
    expenses.length
      ?
      totalExpenses /
      expenses.length
      :
      0;


  averageExpense.textContent =
    euro.format(average);

}



// ========================================
// RENDER
// ========================================

function renderTransactions() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const selectedType =
    typeFilter.value;


  const selectedCategory =
    categoryFilter.value;



  const filtered =
    transactions
      .filter(
        transaction => {

          const matchesSearch =
            transaction
              .description
              .toLowerCase()
              .includes(search);


          const matchesType =
            selectedType === "all"
            ||
            transaction.type ===
            selectedType;


          const matchesCategory =
            selectedCategory ===
            "all"
            ||
            transaction.category ===
            selectedCategory;


          return (
            matchesSearch
            &&
            matchesType
            &&
            matchesCategory
          );

        }
      )
      .sort(
        (a, b) =>
          new Date(b.date)
          -
          new Date(a.date)
      );



  transactionList.innerHTML =
    "";


  emptyState.style.display =
    filtered.length
      ? "none"
      : "flex";



  filtered.forEach(
    transaction => {

      const item =
        document.createElement("article");


      item.className =
        "transaction-item";


      const sign =
        transaction.type ===
        "income"
          ? "+"
          : "−";


      item.innerHTML = `

        <div class="transaction-icon">

          ${categoryIcon(
            transaction.category
          )}

        </div>


        <div class="transaction-main">

          <h3>
            ${transaction.description}
          </h3>


          <div class="transaction-meta">

            <span>
              ${transaction.category}
            </span>

            <span>
              ${formatDate(
                transaction.date
              )}
            </span>

          </div>

        </div>


        <div
          class="transaction-amount
          ${transaction.type}"
        >

          ${sign}
          ${euro.format(
            transaction.amount
          )}

        </div>


        <button
          class="edit-button"
          data-id="${transaction.id}"
          aria-label="Editar"
        >
          ✎
        </button>


        <button
          class="delete-button"
          data-id="${transaction.id}"
          aria-label="Eliminar"
        >
          ✕
        </button>

      `;


      transactionList
        .appendChild(item);

    }
  );



  const total =
    transactions.length;


  countOutput.textContent =
    total === 1
      ?
      "1 movimiento"
      :
      `${total} movimientos`;



  updateSummary();

  updateCategoryAnalytics();

}



// ========================================
// CAMBIAR TIPO
// ========================================

function setType(type) {

  currentType =
    type;


  typeButtons.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.type === type
      );

    }
  );


  if (
    type === "income"
  ) {

    categoryInput.value =
      "Ingresos";

  }

  else if (
    categoryInput.value ===
    "Ingresos"
  ) {

    categoryInput.value =
      "Comida";

  }

}



typeButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        setType(
          button.dataset.type
        );

      }
    );

  }
);



// ========================================
// RESET FORM
// ========================================

function resetForm() {

  form.reset();


  editingId =
    null;


  formTitle.textContent =
    "Añadir operación";


  submitButton.textContent =
    "Añadir movimiento";


  cancelEdit.classList.add(
    "hidden"
  );


  dateInput.value =
    today();


  setType(
    "expense"
  );


  categoryInput.value =
    "Comida";

}



// ========================================
// GUARDAR / EDITAR
// ========================================

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const description =
      descriptionInput.value
        .trim();


    const amount =
      Number(
        amountInput.value
      );


    if (
      !description
      ||
      amount <= 0
    ) {

      return;

    }



    if (editingId) {

      const index =
        transactions.findIndex(
          transaction =>
            transaction.id ===
            editingId
        );


      if (
        index !== -1
      ) {

        transactions[index] = {

          ...transactions[index],

          description,

          amount,

          category:
            categoryInput.value,

          date:
            dateInput.value,

          type:
            currentType

        };

      }


      showToast(
        "Movimiento actualizado ✓"
      );

    }

    else {

      transactions.push({

        id:
          Date.now()
            .toString(),

        description,

        amount,

        category:
          categoryInput.value,

        date:
          dateInput.value,

        type:
          currentType

      });


      showToast(
        "Movimiento añadido ✓"
      );

    }



    saveTransactions();

    resetForm();

    renderTransactions();

  }
);



// ========================================
// EDITAR / BORRAR
// ========================================

transactionList.addEventListener(
  "click",
  event => {

    const editButton =
      event.target.closest(
        ".edit-button"
      );


    const deleteButton =
      event.target.closest(
        ".delete-button"
      );



    if (editButton) {

      const id =
        editButton.dataset.id;


      const transaction =
        transactions.find(
          transaction =>
            transaction.id === id
        );


      if (!transaction) return;


      editingId =
        id;


      descriptionInput.value =
        transaction.description;


      amountInput.value =
        transaction.amount;


      categoryInput.value =
        transaction.category;


      dateInput.value =
        transaction.date;


      setType(
        transaction.type
      );


      categoryInput.value =
        transaction.category;


      formTitle.textContent =
        "Editar movimiento";


      submitButton.textContent =
        "Guardar cambios";


      cancelEdit.classList.remove(
        "hidden"
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }



    if (deleteButton) {

      const id =
        deleteButton.dataset.id;


      transactions =
        transactions.filter(
          transaction =>
            transaction.id !== id
        );


      saveTransactions();

      renderTransactions();

      showToast(
        "Movimiento eliminado"
      );


      if (
        editingId === id
      ) {

        resetForm();

      }

    }

  }
);



// ========================================
// CANCELAR EDICIÓN
// ========================================

cancelEdit.addEventListener(
  "click",
  resetForm
);



// ========================================
// FILTROS
// ========================================

searchInput.addEventListener(
  "input",
  renderTransactions
);


typeFilter.addEventListener(
  "change",
  renderTransactions
);


categoryFilter.addEventListener(
  "change",
  renderTransactions
);



// ========================================
// DATOS DEMO
// ========================================

demoButton.addEventListener(
  "click",
  () => {

    const now =
      new Date();


    const date =
      daysAgo => {

        const d =
          new Date(now);


        d.setDate(
          d.getDate() - daysAgo
        );


        return d
          .toISOString()
          .split("T")[0];

      };



    transactions = [

      {
        id: "demo1",
        description:
          "Ingreso mensual",
        amount: 850,
        category:
          "Ingresos",
        date: date(10),
        type: "income"
      },

      {
        id: "demo2",
        description:
          "Supermercado",
        amount: 54.20,
        category:
          "Comida",
        date: date(2),
        type: "expense"
      },

      {
        id: "demo3",
        description:
          "Restaurante",
        amount: 26.50,
        category:
          "Comida",
        date: date(3),
        type: "expense"
      },

      {
        id: "demo4",
        description:
          "Transporte",
        amount: 18.50,
        category:
          "Transporte",
        date: date(4),
        type: "expense"
      },

      {
        id: "demo5",
        description:
          "Videojuego",
        amount: 29.99,
        category:
          "Ocio",
        date: date(6),
        type: "expense"
      },

      {
        id: "demo6",
        description:
          "Material de estudio",
        amount: 22.40,
        category:
          "Estudios",
        date: date(7),
        type: "expense"
      }

    ];


    saveTransactions();

    resetForm();

    renderTransactions();

    showToast(
      "Datos demo cargados ✓"
    );

  }
);



// ========================================
// INICIO
// ========================================

resetForm();

renderTransactions();
