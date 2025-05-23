export default function Pad(props){
    return (
        <button 
        style={{backgroundColor : props.color}}
        onClick={() => props.toggle(props.id)}
        className={props.on ? "on" : "off"}
        >  
        </button>
    )
}
