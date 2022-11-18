let searchFriendsForm = document.getElementById('searchFriendsForm');
let searchItem = document.getElementById('searchItem');
let section = document.getElementById('results');

searchFriendsForm.addEventListener('submit', searchFriends);

function searchFriends(event) {
    event.preventDefault();
    axios.post('/searchFriends', { searchItem: searchItem.value }).then(response => { 
        let markUp = ``;
        if (typeof response.data.friends != 'undefined') {
            section.innerHTML = '';
            response.data.friends.forEach(data => {
                markUp = `<div class="card">
                            <div class="card-body">                  
                                <p class="card-text">${data.userName}</p>
                                <img src="${data.url}" alt="friend" class="messageImg img-fluid" />
                                <form  method="post" id="friendForm" action="/friend">     
                                    <input type="hidden" value="${data.userName}" name="userName" id="friend" >
                                    <input type="submit" class="btn btn-secondary" value="Friend" >
                                </form>
                            </div>
                        </div>`;
                section.insertAdjacentHTML('afterbegin', markUp);
                let friendsForm = document.getElementById('friendForm');
                friendsForm.addEventListener('submit', friend);
            });
        } else {
            section.innerHTML = '';
            markUp = `<p class="error">${response.data.error}</p>`;
            section.insertAdjacentHTML('afterbegin', markUp);
        };
    }).catch(err => {
        console.log(err);
    });
};

function friend(event) {
    event.preventDefault();
    axios.post('/friend', { friend: event.target.userName.value }).then(() => {
        event.target.innerHTML = "";
    }).catch(err => {
        console.log(err);
    });
};






