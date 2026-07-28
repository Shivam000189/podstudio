


export function Dashboard(){
    
    
    return <div className="p-3 h-screen bg-amber-50 m-2">
        <h1>Hello,
            {JSON.parse(localStorage.getItem("user") || "{}").name?.split(
              " ",
            )[0] || " there"}.
        </h1>

        <h1>No Reacording Yet</h1>

        <button className="border-2">Create Room</button>
    </div>
}