const STORAGE = {
  transactions: "fintrack-transactions-v1",
  budgets: "fintrack-budgets-v11",
  goals: "fintrack-goals-v11",
  recurring: "fintrack-recurring-v11",
  theme: "fintrack-theme-v11"
};

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let transactions = loadArray(STORAGE.transactions);
let budgets = loadArray(STORAGE.budgets);
let goals = loadArray(STORAGE.goals);
let recurring = loadArray(STORAGE.recurring);

let currentType = "expense";
let editingId = null;
let deferredInstallPrompt = null;

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR"
});

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  return today().slice(0, 7);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveAll() {
  localStorage.setItem(
    STORAGE.transactions,
    JSON.stringify(transactions)
  );

  localStorage.setItem(
    STORAGE.budgets,
    JSON.stringify(budgets)
  );

  localStorage.setItem(
    STORAGE.goals,
    JSON.stringify(goals)
  );

  localStorage.setItem(
    STORAGE.recurring,
    JSON.stringify(recurring)
  );
}

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

function formatDate(value) {
  return new Date(
    value + "T00:00:00"
  ).toLocaleDateString(
    "es-ES",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function monthName(value) {
  const [year, month] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString(
    "es-ES",
    {
      month: "short",
      year: "2-digit"
    }
  );
}

/* =========================
   TOAST
========================= */

const toast =
  document.getElementById("toast");

function showToast(text) {
  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(
      () => toast.classList.remove("show"),
      1800
    );
}

/* =========================
   NAVEGACIÓN
========================= */

const views =
  document.querySelectorAll(".view");

const viewButtons =
  document.querySelectorAll(
    "[data-view-target]"
  );

function openView(name) {
  views.forEach(view => {
    view.classList.toggle(
      "active",
      view.dataset.view === name
    );
  });

  document
    .querySelectorAll(
      ".nav-tab, .mobile-tab"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.viewTarget === name
      );
    });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

viewButtons.forEach(button => {
  button.addEventListener(
    "click",
    () =>
      openView(
        button.dataset.viewTarget
      )
  );
});

/* =========================
   TEMA
========================= */

const themeToggle =
  document.getElementById(
    "themeToggle"
  );

const settingsThemeButton =
  document.getElementById(
    "settingsThemeButton"
  );

function applyTheme(theme) {
  document.body.dataset.theme =
    theme;

  localStorage.setItem(
    STORAGE.theme,
    theme
  );

  themeToggle.textContent =
    theme === "dark"
      ? "☀"
      : "☾";
}

let theme =
  localStorage.getItem(
    STORAGE.theme
  );

if (!theme) {
  theme =
    window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches
      ? "light"
      : "dark";
}

applyTheme(theme);

function toggleTheme() {
  const next =
    document.body.dataset.theme ===
    "dark"
      ? "light"
      : "dark";

  applyTheme(next);
}

themeToggle.addEventListener(
  "click",
  toggleTheme
);

settingsThemeButton.addEventListener(
  "click",
  toggleTheme
);

/* =========================
   TRANSACCIONES
========================= */

const form =
  document.getElementById(
    "transactionForm"
  );

const formTitle =
  document.getElementById(
    "formTitle"
  );

const submitButton =
  document.getElementById(
    "submitButton"
  );

const cancelEdit =
  document.getElementById(
    "cancelEdit"
  );

const descriptionInput =
  document.getElementById(
    "description"
  );

const amountInput =
  document.getElementById(
    "amount"
  );

const categoryInput =
  document.getElementById(
    "category"
  );

const dateInput =
  document.getElementById(
    "date"
  );

const typeButtons =
  document.querySelectorAll(
    ".type-button"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const typeFilter =
  document.getElementById(
    "typeFilter"
  );

const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );

const monthFilter =
  document.getElementById(
    "monthFilter"
  );

const transactionList =
  document.getElementById(
    "transactionList"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const transactionCount =
  document.getElementById(
    "transactionCount"
  );

function setType(type) {
  currentType = type;

  typeButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.type === type
    );
  });

  if (type === "income") {
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

typeButtons.forEach(button => {
  button.addEventListener(
    "click",
    () =>
      setType(
        button.dataset.type
      )
  );
});

function resetTransactionForm() {
  form.reset();

  editingId = null;

  formTitle.textContent =
    "Añadir operación";

  submitButton.textContent =
    "Añadir movimiento";

  cancelEdit.classList.add(
    "hidden"
  );

  dateInput.value =
    today();

  setType("expense");

  categoryInput.value =
    "Comida";
}

form.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const description =
      descriptionInput.value.trim();

    const amount =
      Number(
        amountInput.value
      );

    if (
      !description ||
      amount <= 0 ||
      !dateInput.value
    ) {
      return;
    }

    const data = {
      description,
      amount,
      category:
        categoryInput.value,
      date:
        dateInput.value,
      type:
        currentType
    };

    if (editingId) {
      const index =
        transactions.findIndex(
          item =>
            item.id === editingId
        );

      if (index >= 0) {
        transactions[index] = {
          ...transactions[index],
          ...data
        };
      }

      showToast(
        "Movimiento actualizado ✓"
      );
    }

    else {
      transactions.push({
        id: uid(),
        ...data
      });

      showToast(
        "Movimiento añadido ✓"
      );
    }

    saveAll();

    resetTransactionForm();

    renderAll();
  }
);

cancelEdit.addEventListener(
  "click",
  resetTransactionForm
);

transactionList.addEventListener(
  "click",
  event => {
    const edit =
      event.target.closest(
        ".edit-button"
      );

    const remove =
      event.target.closest(
        ".delete-button"
      );

    if (edit) {
      const transaction =
        transactions.find(
          item =>
            item.id ===
            edit.dataset.id
        );

      if (!transaction) {
        return;
      }

      editingId =
        transaction.id;

      descriptionInput.value =
        transaction.description;

      amountInput.value =
        transaction.amount;

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

      openView("dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    if (remove) {
      transactions =
        transactions.filter(
          item =>
            item.id !==
            remove.dataset.id
        );

      if (
        editingId ===
        remove.dataset.id
      ) {
        resetTransactionForm();
      }

      saveAll();

      renderAll();

      showToast(
        "Movimiento eliminado"
      );
    }
  }
);

function refreshMonthOptions() {
  const oldValue =
    monthFilter.value;

  const months =
    [
      ...new Set(
        transactions
          .map(
            item =>
              item.date?.slice(0, 7)
          )
          .filter(Boolean)
          .concat(
            currentMonth()
          )
      )
    ]
      .sort()
      .reverse();

  monthFilter.innerHTML =
    '<option value="all">Todos los meses</option>';

  months.forEach(month => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      month;

    option.textContent =
      monthName(month);

    monthFilter.appendChild(
      option
    );
  });

  if (
    [...monthFilter.options]
      .some(
        option =>
          option.value ===
          oldValue
      )
  ) {
    monthFilter.value =
      oldValue;
  }
}

function renderTransactions() {
  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const filtered =
    transactions
      .filter(item => {
        const description =
          String(
            item.description || ""
          ).toLowerCase();

        const date =
          String(
            item.date || ""
          );

        return (
          description.includes(
            search
          ) &&

          (
            typeFilter.value ===
            "all" ||
            item.type ===
            typeFilter.value
          ) &&

          (
            categoryFilter.value ===
            "all" ||
            item.category ===
            categoryFilter.value
          ) &&

          (
            monthFilter.value ===
            "all" ||
            date.startsWith(
              monthFilter.value
            )
          )
        );
      })

      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

  transactionList.innerHTML =
    "";

  emptyState.style.display =
    filtered.length
      ? "none"
      : "flex";

  filtered.forEach(item => {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "transaction-item";

    const sign =
      item.type === "income"
        ? "+"
        : "−";

    article.innerHTML = `

      <div class="transaction-icon">
        ${categoryIcon(
          item.category
        )}
      </div>

      <div class="transaction-main">

        <h3>
          ${escapeHTML(
            item.description
          )}
        </h3>

        <div class="transaction-meta">

          <span>
            ${escapeHTML(
              item.category
            )}
          </span>

          <span>
            ${formatDate(
              item.date
            )}
          </span>

        </div>

      </div>

      <div
        class="transaction-amount
        ${item.type}"
      >
        ${sign}${euro.format(
          Number(
            item.amount
          )
        )}
      </div>

      <button
        class="edit-button"
        data-id="${item.id}"
        aria-label="Editar"
      >
        ✎
      </button>

      <button
        class="delete-button"
        data-id="${item.id}"
        aria-label="Eliminar"
      >
        ✕
      </button>
    `;

    transactionList.appendChild(
      article
    );
  });

  transactionCount.textContent =
    `${transactions.length} ${
      transactions.length === 1
        ? "movimiento"
        : "movimientos"
    }`;
}

/* =========================
   RESUMEN
========================= */

function renderSummary() {
  const income =
    transactions
      .filter(
        item =>
          item.type === "income"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  const expenses =
    transactions
      .filter(
        item =>
          item.type === "expense"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  const balance =
    income - expenses;

  const savingRate =
    income > 0
      ? (
          balance /
          income
        ) * 100
      : 0;

  document
    .getElementById(
      "balanceValue"
    )
    .textContent =
      euro.format(balance);

  document
    .getElementById(
      "incomeValue"
    )
    .textContent =
      euro.format(income);

  document
    .getElementById(
      "expenseValue"
    )
    .textContent =
      euro.format(expenses);

  document
    .getElementById(
      "savingValue"
    )
    .textContent =
      `${Math.round(
        savingRate
      )} %`;
}

/* =========================
   GRÁFICO CATEGORÍAS
========================= */

function renderCategoryChart() {
  const chart =
    document.getElementById(
      "categoryChart"
    );

  const empty =
    document.getElementById(
      "categoryEmpty"
    );

  const month =
    currentMonth();

  const expenses =
    transactions.filter(
      item =>
        item.type === "expense" &&
        String(
          item.date || ""
        ).startsWith(month)
    );

  const totals = {};

  expenses.forEach(item => {
    totals[item.category] =
      (
        totals[item.category] ||
        0
      ) +
      Number(
        item.amount || 0
      );
  });

  const sorted =
    Object.entries(totals)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  chart.innerHTML =
    "";

  empty.style.display =
    sorted.length
      ? "none"
      : "block";

  const total =
    sorted.reduce(
      (sum, [, amount]) =>
        sum + amount,
      0
    );

  sorted.forEach(
    ([category, amount]) => {
      const percentage =
        total
          ? (
              amount /
              total
            ) * 100
          : 0;

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "category-row";

      row.innerHTML = `

        <div>
          ${categoryIcon(category)}
          ${escapeHTML(category)}
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

      chart.appendChild(row);
    }
  );
}

/* =========================
   GRÁFICO 6 MESES
========================= */

function getLastMonths(count) {
  const result = [];

  const now =
    new Date();

  for (
    let i = count - 1;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    result.push(
      `${date.getFullYear()}-${
        String(
          date.getMonth() + 1
        ).padStart(2, "0")
      }`
    );
  }

  return result;
}

function renderMonthlyChart() {
  const container =
    document.getElementById(
      "monthlyChart"
    );

  const months =
    getLastMonths(6);

  const data =
    months.map(month => {
      const items =
        transactions.filter(
          item =>
            String(
              item.date || ""
            ).startsWith(month)
        );

      const income =
        items
          .filter(
            item =>
              item.type ===
              "income"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          );

      const expense =
        items
          .filter(
            item =>
              item.type ===
              "expense"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          );

      return {
        month,
        income,
        expense
      };
    });

  const maxValue =
    Math.max(
      1,
      ...data.map(
        item =>
          Math.max(
            item.income,
            item.expense
          )
      )
    );

  container.innerHTML =
    "";

  data.forEach(item => {
    const column =
      document.createElement(
        "div"
      );

    column.className =
      "month-column";

    column.innerHTML = `

      <div
        class="month-bars"
        title="Ingresos: ${
          euro.format(
            item.income
          )
        } · Gastos: ${
          euro.format(
            item.expense
          )
        }"
      >

        <div
          class="month-income"
          style="height:${
            (
              item.income /
              maxValue
            ) * 100
          }%"
        >
        </div>

        <div
          class="month-expense"
          style="height:${
            (
              item.expense /
              maxValue
            ) * 100
          }%"
        >
        </div>

      </div>

      <div class="month-label">
        ${monthName(
          item.month
        )}
      </div>
    `;

    container.appendChild(
      column
    );
  });
}

/* =========================
   PRESUPUESTOS
========================= */

const budgetForm =
  document.getElementById(
    "budgetForm"
  );

const budgetList =
  document.getElementById(
    "budgetList"
  );

budgetForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const category =
      document.getElementById(
        "budgetCategory"
      ).value;

    const limit =
      Number(
        document.getElementById(
          "budgetLimit"
        ).value
      );

    if (limit <= 0) {
      return;
    }

    const existing =
      budgets.find(
        item =>
          item.category ===
          category
      );

    if (existing) {
      existing.limit =
        limit;
    }

    else {
      budgets.push({
        id: uid(),
        category,
        limit
      });
    }

    saveAll();

    budgetForm.reset();

    renderBudgets();

    showToast(
      "Presupuesto guardado ✓"
    );
  }
);

budgetList.addEventListener(
  "click",
  event => {
    const button =
      event.target.closest(
        "[data-delete-budget]"
      );

    if (!button) {
      return;
    }

    budgets =
      budgets.filter(
        item =>
          item.id !==
          button.dataset
            .deleteBudget
      );

    saveAll();

    renderBudgets();
  }
);

function renderBudgets() {
  const empty =
    document.getElementById(
      "budgetEmpty"
    );

  budgetList.innerHTML =
    "";

  empty.style.display =
    budgets.length
      ? "none"
      : "block";

  const month =
    currentMonth();

  budgets.forEach(budget => {
    const spent =
      transactions
        .filter(
          item =>
            item.type ===
            "expense" &&

            item.category ===
            budget.category &&

            String(
              item.date || ""
            ).startsWith(month)
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount || 0
            ),
          0
        );

    const percentage =
      budget.limit
        ? (
            spent /
            budget.limit
          ) * 100
        : 0;

    let statusClass =
      "";

    if (percentage >= 100) {
      statusClass =
        "over";
    }

    else if (
      percentage >= 80
    ) {
      statusClass =
        "warning";
    }

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "item-card";

    card.innerHTML = `

      <div class="item-card-top">

        <div>

          <h3>
            ${categoryIcon(
              budget.category
            )}
            ${escapeHTML(
              budget.category
            )}
          </h3>

          <p>
            Límite:
            ${euro.format(
              Number(
                budget.limit
              )
            )}
          </p>

        </div>

        <button
          class="small-delete"
          data-delete-budget="${
            budget.id
          }"
        >
          ✕
        </button>

      </div>

      <div class="progress-info">

        <span>
          ${euro.format(spent)}
          gastados
        </span>

        <span>
          ${Math.round(
            percentage
          )} %
        </span>

      </div>

      <div class="progress-track">

        <div
          class="
            progress-fill
            ${statusClass}
          "
          style="width:${
            Math.min(
              percentage,
              100
            )
          }%"
        >
        </div>

      </div>
    `;

    budgetList.appendChild(
      card
    );
  });
}

/* =========================
   OBJETIVOS
========================= */

const goalForm =
  document.getElementById(
    "goalForm"
  );

const goalList =
  document.getElementById(
    "goalList"
  );

goalForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const name =
      document
        .getElementById(
          "goalName"
        )
        .value
        .trim();

    const target =
      Number(
        document.getElementById(
          "goalTarget"
        ).value
      );

    const saved =
      Number(
        document.getElementById(
          "goalSaved"
        ).value
      ) || 0;

    if (
      !name ||
      target <= 0
    ) {
      return;
    }

    goals.push({
      id: uid(),
      name,
      target,
      saved:
        Math.max(
          saved,
          0
        )
    });

    saveAll();

    goalForm.reset();

    document.getElementById(
      "goalSaved"
    ).value = 0;

    renderGoals();

    showToast(
      "Objetivo creado ✓"
    );
  }
);

goalList.addEventListener(
  "click",
  event => {
    const addButton =
      event.target.closest(
        "[data-add-goal]"
      );

    const deleteButton =
      event.target.closest(
        "[data-delete-goal]"
      );

    if (addButton) {
      const id =
        addButton.dataset
          .addGoal;

      const input =
        goalList.querySelector(
          `[data-goal-input="${id}"]`
        );

      const amount =
        Number(
          input?.value
        );

      if (amount <= 0) {
        return;
      }

      const goal =
        goals.find(
          item =>
            item.id === id
        );

      if (!goal) {
        return;
      }

      goal.saved += amount;

      saveAll();

      renderGoals();

      showToast(
        "Ahorro añadido ✓"
      );
    }

    if (deleteButton) {
      goals =
        goals.filter(
          item =>
            item.id !==
            deleteButton.dataset
              .deleteGoal
        );

      saveAll();

      renderGoals();
    }
  }
);

function renderGoals() {
  const empty =
    document.getElementById(
      "goalEmpty"
    );

  goalList.innerHTML =
    "";

  empty.style.display =
    goals.length
      ? "none"
      : "block";

  goals.forEach(goal => {
    const percentage =
      goal.target
        ? (
            goal.saved /
            goal.target
          ) * 100
        : 0;

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "item-card";

    card.innerHTML = `

      <div class="item-card-top">

        <div>

          <h3>
            🎯
            ${escapeHTML(
              goal.name
            )}
          </h3>

          <p>
            ${euro.format(
              Number(
                goal.saved
              )
            )}
            de
            ${euro.format(
              Number(
                goal.target
              )
            )}
          </p>

        </div>

        <button
          class="small-delete"
          data-delete-goal="${
            goal.id
          }"
        >
          ✕
        </button>

      </div>

      <div class="progress-info">

        <span>
          Progreso
        </span>

        <span>
          ${Math.min(
            Math.round(
              percentage
            ),
            100
          )} %
        </span>

      </div>

      <div class="progress-track">

        <div
          class="progress-fill"
          style="width:${
            Math.min(
              percentage,
              100
            )
          }%"
        >
        </div>

      </div>

      <div class="goal-input-row">

        <input
          data-goal-input="${
            goal.id
          }"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Añadir €"
        >

        <button
          class="small-button"
          data-add-goal="${
            goal.id
          }"
        >
          + Aportar
        </button>

      </div>
    `;

    goalList.appendChild(
      card
    );
  });
}

/* =========================
   RECURRENTES
========================= */

const recurringForm =
  document.getElementById(
    "recurringForm"
  );

const recurringList =
  document.getElementById(
    "recurringList"
  );

recurringForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    const description =
      document
        .getElementById(
          "recurringDescription"
        )
        .value
        .trim();

    const amount =
      Number(
        document.getElementById(
          "recurringAmount"
        ).value
      );

    const day =
      Number(
        document.getElementById(
          "recurringDay"
        ).value
      );

    if (
      !description ||
      amount <= 0
    ) {
      return;
    }

    recurring.push({
      id: uid(),

      type:
        document.getElementById(
          "recurringType"
        ).value,

      description,

      amount,

      category:
        document.getElementById(
          "recurringCategory"
        ).value,

      day:
        Math.min(
          31,
          Math.max(
            1,
            day || 1
          )
        )
    });

    saveAll();

    recurringForm.reset();

    document.getElementById(
      "recurringDay"
    ).value = 1;

    renderRecurring();

    showToast(
      "Recurrente guardado ✓"
    );
  }
);

recurringList.addEventListener(
  "click",
  event => {
    const apply =
      event.target.closest(
        "[data-apply-recurring]"
      );

    const remove =
      event.target.closest(
        "[data-delete-recurring]"
      );

    if (apply) {
      applyRecurring(
        apply.dataset
          .applyRecurring
      );
    }

    if (remove) {
      recurring =
        recurring.filter(
          item =>
            item.id !==
            remove.dataset
              .deleteRecurring
        );

      saveAll();

      renderRecurring();
    }
  }
);

function recurringKey(
  id,
  month
) {
  return `${id}-${month}`;
}

function applyRecurring(id) {
  const item =
    recurring.find(
      recurringItem =>
        recurringItem.id === id
    );

  if (!item) {
    return;
  }

  const month =
    currentMonth();

  const key =
    recurringKey(
      item.id,
      month
    );

  if (
    transactions.some(
      transaction =>
        transaction
          .recurringKey === key
    )
  ) {
    showToast(
      "Ya está añadido este mes"
    );

    return;
  }

  const [
    year,
    monthNumber
  ] =
    month
      .split("-")
      .map(Number);

  const maximumDay =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  const day =
    Math.min(
      item.day,
      maximumDay
    );

  const date =
    `${month}-${
      String(day)
        .padStart(2, "0")
    }`;

  transactions.push({
    id: uid(),
    type: item.type,
    description:
      item.description,
    amount:
      item.amount,
    category:
      item.category,
    date,
    recurringKey:
      key
  });

  saveAll();

  renderAll();

  showToast(
    "Movimiento mensual añadido ✓"
  );
}

function renderRecurring() {
  const empty =
    document.getElementById(
      "recurringEmpty"
    );

  recurringList.innerHTML =
    "";

  empty.style.display =
    recurring.length
      ? "none"
      : "block";

  recurring.forEach(item => {
    const alreadyAdded =
      transactions.some(
        transaction =>
          transaction
            .recurringKey ===
          recurringKey(
            item.id,
            currentMonth()
          )
      );

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "item-card";

    card.innerHTML = `

      <div class="item-card-top">

        <div>

          <h3>
            ${categoryIcon(
              item.category
            )}
            ${escapeHTML(
              item.description
            )}
          </h3>

          <p>
            ${euro.format(
              Number(
                item.amount
              )
            )}
            · día
            ${item.day}
          </p>

        </div>

        <button
          class="small-delete"
          data-delete-recurring="${
            item.id
          }"
        >
          ✕
        </button>

      </div>

      <button
        class="small-button"
        data-apply-recurring="${
          item.id
        }"
        ${
          alreadyAdded
            ? "disabled"
            : ""
        }
        style="margin-top:18px;"
      >

        ${
          alreadyAdded
            ? "✓ Añadido este mes"
            : "Añadir este mes"
        }

      </button>
    `;

    recurringList.appendChild(
      card
    );
  });
}

/* =========================
   FILTROS
========================= */

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

monthFilter.addEventListener(
  "change",
  renderTransactions
);

/* =========================
   DATOS DEMO
========================= */

document
  .getElementById(
    "demoButton"
  )
  .addEventListener(
    "click",
    () => {
      const hasData =
        transactions.length ||
        budgets.length ||
        goals.length ||
        recurring.length;

      if (
        hasData &&
        !confirm(
          "Esto sustituirá los datos actuales por datos demo. ¿Continuar?"
        )
      ) {
        return;
      }

      const now =
        new Date();

      function dateMonthsAgo(
        monthsAgo,
        day
      ) {
        const date =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              monthsAgo,
            day
          );

        return date
          .toISOString()
          .split("T")[0];
      }

      transactions = [
        {
          id: uid(),
          type: "income",
          description:
            "Ingreso mensual",
          amount: 850,
          category:
            "Ingresos",
          date:
            dateMonthsAgo(
              0,
              1
            )
        },

        {
          id: uid(),
          type: "expense",
          description:
            "Supermercado",
          amount: 54.20,
          category:
            "Comida",
          date:
            dateMonthsAgo(
              0,
              5
            )
        },

        {
          id: uid(),
          type: "expense",
          description:
            "Videojuego",
          amount: 29.99,
          category:
            "Ocio",
          date:
            dateMonthsAgo(
              0,
              9
            )
        },

        {
          id: uid(),
          type: "expense",
          description:
            "Transporte",
          amount: 22,
          category:
            "Transporte",
          date:
            dateMonthsAgo(
              0,
              12
            )
        }
      ];

      for (
        let i = 1;
        i <= 5;
        i++
      ) {
        transactions.push(
          {
            id: uid(),
            type: "income",
            description:
              "Ingreso mensual",
            amount:
              700 + i * 20,
            category:
              "Ingresos",
            date:
              dateMonthsAgo(
                i,
                1
              )
          },

          {
            id: uid(),
            type: "expense",
            description:
              "Gastos del mes",
            amount:
              220 + i * 15,
            category:
              "Otros",
            date:
              dateMonthsAgo(
                i,
                10
              )
          }
        );
      }

      budgets = [
        {
          id: uid(),
          category:
            "Ocio",
          limit: 100
        },

        {
          id: uid(),
          category:
            "Comida",
          limit: 180
        }
      ];

      goals = [
        {
          id: uid(),
          name:
            "Nuevo ordenador",
          target: 1000,
          saved: 320
        }
      ];

      recurring = [
        {
          id: uid(),
          type: "expense",
          description:
            "Suscripción",
          amount: 9.99,
          category:
            "Ocio",
          day: 3
        }
      ];

      saveAll();

      resetTransactionForm();

      renderAll();

      showToast(
        "Demo cargada ✓"
      );
    }
  );

/* =========================
   EXPORTAR
========================= */

document
  .getElementById(
    "exportButton"
  )
  .addEventListener(
    "click",
    () => {
      const backup = {
        app: "FinTrack",
        version: 11,
        exportedAt:
          new Date().toISOString(),
        transactions,
        budgets,
        goals,
        recurring
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              backup,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        `fintrack-backup-${today()}.json`;

      link.click();

      URL.revokeObjectURL(
        url
      );

      showToast(
        "Copia exportada ✓"
      );
    }
  );

/* =========================
   IMPORTAR
========================= */

const importFile =
  document.getElementById(
    "importFile"
  );

document
  .getElementById(
    "importButton"
  )
  .addEventListener(
    "click",
    () =>
      importFile.click()
  );

importFile.addEventListener(
  "change",
  event => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        try {
          const data =
            JSON.parse(
              reader.result
            );

          transactions =
            Array.isArray(
              data.transactions
            )
              ? data.transactions
              : [];

          budgets =
            Array.isArray(
              data.budgets
            )
              ? data.budgets
              : [];

          goals =
            Array.isArray(
              data.goals
            )
              ? data.goals
              : [];

          recurring =
            Array.isArray(
              data.recurring
            )
              ? data.recurring
              : [];

          saveAll();

          renderAll();

          showToast(
            "Copia restaurada ✓"
          );
        }

        catch {
          alert(
            "El archivo no parece una copia válida de FinTrack."
          );
        }
      };

    reader.readAsText(file);

    event.target.value =
      "";
  }
);

/* =========================
   BORRAR TODO
========================= */

document
  .getElementById(
    "clearAllButton"
  )
  .addEventListener(
    "click",
    () => {
      if (
        !confirm(
          "¿Seguro? Se borrarán todos los datos de FinTrack de este dispositivo."
        )
      ) {
        return;
      }

      transactions = [];
      budgets = [];
      goals = [];
      recurring = [];

      saveAll();

      resetTransactionForm();

      renderAll();

      showToast(
        "Datos borrados"
      );
    }
  );

/* =========================
   PWA
========================= */

const pwaStatus =
  document.getElementById(
    "pwaStatus"
  );

const installButton =
  document.getElementById(
    "installButton"
  );

if (
  "serviceWorker"
  in navigator
) {
  navigator
    .serviceWorker
    .register(
      "./sw.js?v=11"
    )

    .then(
      () => {
        pwaStatus.textContent =
          "FinTrack está preparado para funcionar offline tras la primera carga.";
      }
    )

    .catch(
      () => {
        pwaStatus.textContent =
          "No se ha podido activar el modo offline.";
      }
    );
}

else {
  pwaStatus.textContent =
    "Este navegador no admite el modo offline de FinTrack.";
}

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();

    deferredInstallPrompt =
      event;

    pwaStatus.textContent =
      "FinTrack puede instalarse en este dispositivo.";
  }
);

window.addEventListener(
  "appinstalled",
  () => {
    deferredInstallPrompt =
      null;

    pwaStatus.textContent =
      "FinTrack está instalado.";

    showToast(
      "FinTrack instalado ✓"
    );
  }
);

installButton.addEventListener(
  "click",
  async () => {
    if (
      deferredInstallPrompt
    ) {
      deferredInstallPrompt.prompt();

      await deferredInstallPrompt
        .userChoice;

      deferredInstallPrompt =
        null;

      return;
    }

    alert(
      "Chrome no está ofreciendo el cuadro automático en este momento. Abre el menú ⋮ de Chrome y pulsa «Instalar aplicación» o «Añadir a pantalla de inicio»."
    );
  }
);

/* =========================
   RENDER GENERAL
========================= */

function renderAll() {
  refreshMonthOptions();

  renderSummary();

  renderTransactions();

  renderCategoryChart();

  renderMonthlyChart();

  renderBudgets();

  renderGoals();

  renderRecurring();
}

resetTransactionForm();

renderAll();
