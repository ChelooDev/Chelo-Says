import React from "react"
import padsData from "./pads"
import Pad from "./Pad"

export default function App() {
    const [pads, setPads] = React.useState(padsData)

   function togglePad(id) {
        setPads(prevPads => prevPads.map(item => {
            return item.id === id ? {...item, on: !item.on} : item
        }))
    }

    function shutAllPads(){
        setPads(prevPads => prevPads.map(item => {
            return item.on = {...item, on: false}
        }))
    }

    const buttonElements = pads.map(variableX => (
        <Pad 
        key ={variableX.id} 
        color={variableX.color} 
        id={variableX.id}
        on={variableX.on}
        toggle ={togglePad}
        />
    ))

    return (
        <>
        <header>
            <button class="shutPads" onClick={shutAllPads}>Turn Off</button>
        </header>
        <main>
            <div className="pad-container">
                {buttonElements}
            </div>
        </main>
        </>
    )
}

