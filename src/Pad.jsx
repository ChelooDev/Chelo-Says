export default function Pad(props) {
    return (
        <button 
            type="button"
            style={{ backgroundColor: props.color }}
            onClick={(e) => {
                e.preventDefault();
                props.toggle(props.id);
            }}

            className={`pad-button ${props.on ? "on" : ""}`}
        >
        </button>
    )
}
