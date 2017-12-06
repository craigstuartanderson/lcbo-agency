import React from 'react';
import Navigation from './Navigation';
import firebase from 'firebase'
import Heading from './Heading'


class Pantry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userPantry: [],
            currentRating: 0.5,
            currentNotes: '',
            currentWine: '',
            currentSort: 'date',
            currentOrder: 'descending',
            displaySort: false,
            displayFilter: false,
            displaySearch: false,
            filterType: '',
            filterSugar: '',
            restartPantry: [],
            cancelEditRating: 0.5,
            cancelEditNotes: ''
        }
        
        this.editWine = this.editWine.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
        this.deleteWine = this.deleteWine.bind(this);
        this.listerForNewId = this.listenForNewId.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSearchToggle = this.handleSearchToggle.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSorting = this.handleSorting.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
        this.displayPrice = this.displayPrice.bind(this);

    }

    componentDidMount() {
        if (this.props.userID) {
            this.listenForNewId(this.props.userID);
        }
    }

    componentWillReceiveProps(nextProps){
        this.listenForNewId(nextProps.userID);
    }

    // listen for firebase ID change and call for that ID's data
    listenForNewId(newID){
        
        const wineApp = firebase.database().ref(`/users/${newID}/pantry`);
        
        wineApp.on('value', (snapshot) => {
            const userPantry = [];
            let dbPantry = snapshot.val();
            for (let wineKey in dbPantry) {
                userPantry.push(dbPantry[wineKey]);
            }
            userPantry.reverse();
            this.setState({
                userPantry,
                restartPantry: userPantry
            });
        }); 
    }

    handleChange(stateId, e) {
        let newValue = e.target.value;
        if (stateId === 'currentRating') {
            newValue = parseFloat(newValue);
        }
        this.setState({
            [stateId]: newValue
        })
    }

    handleSearchToggle(stateId, e) {
        if (stateId === 'displaySort') {
            this.setState({
                displayFilter: false,
                displaySort: true
            })
        } else if (stateId === 'displayFilter') {
            this.setState({
                displayFilter: true,
                displaySort: false
            })
        } else {
            this.setState({
                displayFilter: false,
                displaySort: false
            })
            this.setState({
                userPantry: this.state.restartPantry,
                filterType: '',
                filterSugar: '',
            })
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const wineApp = firebase.database().ref(`/users/${this.props.userID}/pantry`);
        wineApp.on('value', (snapshot) => {
            let dbPantry = snapshot.val();
            for (let wineKey in dbPantry) {
                if (dbPantry[wineKey].id === this.state.currentWine) {
                    let updates = {};
                    updates[`/${wineKey}/userRating`] = this.state.currentRating;
                    updates[`/${wineKey}/userNotes`] = this.state.currentNotes;
                    wineApp.update(updates);
                }
            }
        });
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
        return;
    }

    handleSorting(e) {
        const userPantry = this.state.userPantry
        const sortBy = this.state.currentSort;
        if (userPantry) {
            userPantry.sort(function (a, b) { 
                return a[sortBy] > b[sortBy]
            })

            if (this.state.currentOrder === 'descending') {
                userPantry.reverse();
            }
            this.setState({
                userPantry,
                
            });
        }
        return;
    }
    handleFilter(e) {
        let userPantry = this.state.userPantry
        const type = this.state.filterType;
        const sugar = this.state.filterSugar;
        if (type) {
            userPantry = userPantry.filter(wine => wine.typeWine === type);
        } 
        if (sugar) {
            userPantry = userPantry.filter(wine => wine.sugar_content_letters === sugar);
        } 
        this.setState({
            userPantry
        });
        return;
    }

    editWine(wine) {
        const modal = document.getElementById('modal');
        modal.style.display = 'block';
        const userPantry = this.state.userPantry;
        this.setState({
            currentWine: wine.id,
            currentRating: wine.userRating,
            currentNotes: wine.userNotes,
            cancelEditRating: wine.userRating,
            cancelEditNotes: wine.userNotes,

        })
        return; 
    }

    cancelEdit() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
        const currentRating = this.state.cancelEditRating;
        const currentNotes = this.state.cancelEditNotes;
        this.setState({
            currentRating,
            currentNotes
        })
        
    }
        
    deleteWine(wineId) {
        const wineApp = firebase.database().ref(`/users/${this.props.userID}/pantry`);
        wineApp.on('value', (snapshot) => {
            let dbPantry = snapshot.val();
            for (let wineKey in dbPantry) {
                if (dbPantry[wineKey].id === wineId) {
                    wineApp.child(wineKey).remove()
                } 
            }
        });
        return;
    }

    displayPrice(price) {
        price = price.toString();
        let priceArray = price.split('.')
        if (priceArray.length < 2) {
            price += '.00'
        } else if (priceArray[1].length < 2) {
            price += '0'
        }
        return price
    }

    render() {
        return (
            <div className='userPantry'>
                <Heading />
                <h1>My Wine Pantry</h1>
                <h2 className="mobileTitle">Pantry</h2>
                <Navigation />
                <div className="searchPantry clearfix">
                    <div className="searchPantryButtons">
                        <button onClick={(e) => this.handleSearchToggle('displaySort', e)}>Sort</button>
                        <button onClick={(e) => this.handleSearchToggle('displayFilter', e)}>Filter</button>
                    </div>
                    {this.state.displaySort || this.state.displayFilter ? 
                        <div className="searchBox clearfix">
                            {this.state.displaySort ?
                                <div className="sortBox">
                                    <div className="sortBox_option clearfix">
                                        <label htmlFor="sort">Sort by:</label>
                                        <select id="sort" 
                                        value={this.state.currentSort}
                                        onChange={(e) => this.handleChange('currentSort', e)}>
                                            <option value="price">Price</option>
                                            <option value="date">Date Added</option>
                                            <option value="userRating">My Rating</option>
                                        </select>
                                    </div>
                                    <div className="sortBox_option clearfix">
                                        <label htmlFor="order">Order by:</label>
                                        <select id="order" value={this.state.currentOrder}
                                            onChange={(e) => this.handleChange('currentOrder', e)}>
                                            <option value="ascending">Ascending</option>
                                            <option value="descending">Descending</option>
                                        </select>
                                    </div>
                                </div>
                                : 
                                <div className="filterBox clearfix">
                                    <form >
                                        <div className="filter_wineType clearfix">
                                            <p>Select a type of wine:</p>
                                            <input type="radio" id="red"
                                                name="type" value="red" onChange={(e) => this.handleChange('filterType', e)}/>
                                            <label for="red">Red</label>

                                            <input type="radio" id="white"
                                                name="type" value="white" onChange={(e) => this.handleChange('filterType', e)}/>
                                            <label for="white">White</label>

                                            <input type="radio" id="rose"
                                                name="type" value="rose" onChange={(e) => this.handleChange('filterType', e)}/>
                                            <label for="rose">Rose</label>
                                        </div>

                                        <div className="filter_sugarContent clearfix">
                                            <p>Select your preferred sugar content:</p>
                                            <input type="radio" id="extraDry"
                                                name="sugar" value="XD" onChange={(e) => this.handleChange('filterSugar', e)}/>
                                            <label for="extraDry">Extra dry</label>

                                            <input type="radio" id="dry"
                                                name="sugar" value="D" onChange={(e) => this.handleChange('filterSugar', e)}/>
                                            <label for="dry">Dry</label>

                                            <input type="radio" id="medium"
                                                name="sugar" value="M" onChange={(e) => this.handleChange('filterSugar', e)}/>
                                            <label for="medium">Medium</label>

                                            <input type="radio" id="mediumSweet"
                                                name="sugar" value="MS" onChange={(e) => this.handleChange('filterSugar', e)} />
                                            <label for="mediumSweet">Medium Sweet</label>

                                            <input type="radio" id="sweet"
                                                name="sugar" value="S" onChange={(e) => this.handleChange('filterSugar', e)}/>
                                            <label for="sweet">Sweet</label>
                                        </div>

                                    </form>
                                </div>
                                }

                            <div className="searchSubmitButtons clearfix">
                                <button onClick={(e) => this.handleSearchToggle('clear', e)}>Clear</button>

                                {this.state.displaySort ? 
                                    <button onClick={(e) => this.handleSorting('submit', e)}>Submit</button>
                                    : <button onClick={(e) => this.handleFilter('submit', e)}>Submit</button>
                                    }
                            </div>
                        </div>                  
                        :''}
                </div>
                <ul className="clearfix">
                    {this.state.userPantry.map((wine) => {
                        return (
                            <li key={wine.id} className={`pantryItem clearfix`}>
                                <div className = "pantry_dataBox clearfix">
                                    <div className="pantry_imageBox">
                                        <img 
                                        src={wine.image_typeWine} 
                                        alt={`image of ${wine.name}, a ${wine.secondary_category}`}/>
                                    </div>

                                    <div className="wineInfo clearfix">
                                        <h3 className="wineInfo_name">{wine.name}</h3>
                                        <div className="clearfix">
                                            <div className="wineInfo_indicators">
                                                <div className = "wineType clearfix">
                                                    <div className={`wineType_indicator ${wine.typeWine}`}></div>
                                                    <h6 className = "wineType_name">{wine.varietal}</h6>
                                                </div>
                                                <div className="wineDetails clearfix">
                                                    <div className={`wineDetails_indicator clearfix`}><h3>{wine.sugar_content_letters}</h3></div>
                                                    <h6 className = "wineDetails_name">{wine.sugar_content}</h6> 
                                                </div>
                                            </div> {/* end of wineInfo_indicators*/}
                                            <div className="winePrice">
                                                <h6>${this.displayPrice(wine.price)}</h6>
                                            </div>
                                        </div>
                                    </div> {/* end of wineInfo*/}
                                </div> {/* end of Pantry_dataBox*/}
                                <div>
                                    <h6 className="wineInfo_description clearfix">{wine.description}</h6>
                                </div>
                                <div className="userWineInfo clearfix">
                                    <div className="userWineInfo_rating">
                                        <h6>{wine.userRating} / 5</h6>
                                    </div>
                                    <div className="userWineInfo_notes">
                                        <h6>{wine.userNotes}</h6>
                                    </div>
                                </div>
                                <div className="pantryButtons clearfix">
                                    <button className="deleteBtn" onClick={() => this.deleteWine(wine.id)}>Delete</button>
                                    <button className="editBtn"  onClick={() => this.editWine(wine)}>Edit</button>
                                </div>

                                    {/*  */}
                                {/* <div className="userData">
                                
                                </div> */}
                            </li>
                        )
                    })}

                <div className="modal" id="modal">
                    <form action="submit" onSubmit={this.handleSubmit}>
                        <div className="formContent clearfix">
                            <div className="textField">
                                <label htmlFor="notes" className="hidden">Tasting Notes</label>

                                <textarea placeholder="Add your notes here" name="notes" id="notes" cols="30" rows="10" value={this.state.currentNotes}
                                        onChange={(e) => this.handleChange('currentNotes', e)}>></textarea>

                            </div>
                            <div className="ratingsField"> 
                                <label htmlFor="rating">Rating</label>
                                <select name="rating" 
                                value={this.state.currentRating}
                                    selected={this.state.currentRating}
                                    onChange={(e) => this.handleChange('currentRating', e)}>
                                    <option value='5'>5</option>
                                    <option value='4.5'>4.5</option>
                                    <option value='4'>4</option>
                                    <option value='3.5'>3.5</option>
                                    <option value='3'>3</option>
                                    <option value='2.5'>2.5</option>
                                    <option value='2'>2</option>
                                    <option value='1.5'>1.5</option>
                                    <option value='1'>1</option>
                                    <option value='0.5'>0.5</option>
                                </select>
                                <div className="modalButtons clearfix">
                                    <button>Submit</button>
                                    <button className="cancelBtn" onClick={this.cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                </ul>
            </div>
        );
    }
}

export default Pantry;