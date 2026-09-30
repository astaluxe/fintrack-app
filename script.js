// ======================================
// FINTRACK V1
// ======================================

const STORAGE_KEY = "fintrack-transactions-v1";

let transactions =
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let currentType = "expense";


// ELEMENTOS

const form =
  document.getElementById("transactionForm");

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


// FECHA DE HOY

dateInput.value =
  new Date().toISOString().split("T")[0];


// FORMATO EURO

const euro =
  new Intl.NumberFormat(
    "es-ES",
    {
      style: "currency",
      currency: "EUR"
    }
  );


// GUARDAR

function saveTransactions() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions)
  );

}


// ICONOS

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


// FORMATEAR FECHA

function formatDate(dateString) {

  const date =
    new Date(dateString + "T00:00:00");

  return date.toLocaleDateString(
    "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


// RESUMEN

function updateSummary() {

  const income =
    transactions
      .filter(t => t.type === "income")
      .reduce(
        (total, t) => total + t.amount,
        0
      );

  const expenses =
    transactions
      .filter(t => t.type === "expense")
      .reduce(
        (total, t) => total + t.amount,
        0
      );

  const balance =
    income - expenses;

  let savingRate = 0;

  if (income > 0) {

    savingRate =
      ((income - expenses) / income) * 100;

  }

  balanceOutput.textContent =
    euro.format(balance);

  incomeOutput.textContent =
    euro.format(income);

  expenseOutput.textContent =
    euro.format(expenses);

  savingOutput.textContent =
    Math.round(savingRate) + " %";

}


// RENDER

function renderTransactions() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const selectedType =
    typeFilter.value;

  const selectedCategory =
    categoryFilter.value;


  let filtered =
    transactions.filter(transaction => {

      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(search);

      const matchesType =
        selectedType === "all" ||
        transaction.type === selectedType;

      const matchesCategory =
        selectedCategory === "all" ||
        transaction.category === selectedCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      );

    });


  filtered.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );


  transactionList.innerHTML = "";


  emptyState.style.display =
    filtered.length === 0
      ? "flex"
      : "none";


  filtered.forEach(transaction => {

    const item =
      document.createElement("article");

    item.className =
      "transaction-item";


    const sign =
      transaction.type === "income"
        ? "+"
        : "−";


    item.innerHTML = `

      <div class="transaction-icon">
        ${categoryIcon(transaction.category)}
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
            ${formatDate(transaction.date)}
          </span>

        </div>

      </div>

      <div class="transaction-amount ${transaction.type}">

        ${sign}${euro.format(transaction.amount)}

      </div>

      <button
        class="delete-button"
        data-id="${transaction.id}"
        aria-label="Eliminar movimiento"
      >
        ✕
      </button>

    `;


    transactionList.appendChild(item);

  });


  const total =
    transactions.length;

  countOutput.textContent =
    total === 1
      ? "1 movimiento"
      : `${total} movimientos`;


  updateSummary();

}


// TIPO INGRESO / GASTO

typeButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      typeButtons.forEach(
        b => b.classList.remove("active")
      );

      button.classList.add("active");

      currentType =
        button.dataset.type;


      if (currentType === "income") {

        categoryInput.value =
          "Ingresos";

      }

      else if (
        categoryInput.value === "Ingresos"
      ) {

        categoryInput.value =
          "Comida";

      }

    }
  );

});


// AÑADIR

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const amount =
      Number(amountInput.value);


    if (
      !descriptionInput.value.trim() ||
      amount <= 0
    ) {

      return;

    }


    const transaction = {

      id:
        Date.now().toString(),

      description:
        descriptionInput.value.trim(),

      amount,

      category:
        categoryInput.value,

      date:
        dateInput.value,

      type:
        currentType

    };


    transactions.push(transaction);

    saveTransactions();

    form.reset();


    dateInput.value =
      new Date()
        .toISOString()
        .split("T")[0];


    currentType =
      "expense";


    typeButtons.forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.type === "expense"
      );

    });


    categoryInput.value =
      "Comida";


    renderTransactions();

  }
);


// ELIMINAR

transactionList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(".delete-button");

    if (!button) return;


    const id =
      button.dataset.id;


    transactions =
      transactions.filter(
        transaction =>
          transaction.id !== id
      );


    saveTransactions();

    renderTransactions();

  }
);


// FILTROS

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


// DATOS DEMO

demoButton.addEventListener(
  "click",
  () => {

    const today =
      new Date();

    const date =
      daysAgo => {

        const d =
          new Date(today);

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
        description: "Ingreso mensual",
        amount: 850,
        category: "Ingresos",
        date: date(10),
        type: "income"
      },

      {
        id: "demo2",
        description: "Supermercado",
        amount: 54.20,
        category: "Comida",
        date: date(2),
        type: "expense"
      },

      {
        id: "demo3",
        description: "Transporte",
        amount: 18.50,
        category: "Transporte",
        date: date(4),
        type: "expense"
      },

      {
        id: "demo4",
        description: "Videojuego",
        amount: 29.99,
        category: "Ocio",
        date: date(6),
        type: "expense"
      },

      {
        id: "demo5",
        description: "Material de estudio",
        amount: 22.40,
        category: "Estudios",
        date: date(7),
        type: "expense"
      }

    ];


    saveTransactions();

    renderTransactions();

  }
);


// INICIO

renderTransactions();
