import { useNavigate, useParams } from "react-router-dom";


type generateId = {
    generat: string;
}

export function Rooms(){
    const {id} = useParams();    

    return <div className="bg-amber-100">
        <h1>Hello this is room 
            {id}
        </h1>
    </div>
}