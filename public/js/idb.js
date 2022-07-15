let db;
const request = indexedDB.open('budget', 1);// open IndexedDB 'budget' V1

// create Contacts-object-store & index, with auto-increment id
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// open the database, call '' function when back online
request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// i
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    // clear all items in your store
                    budgetObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    // set reference to redirect back here
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);