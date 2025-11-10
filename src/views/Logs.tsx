import LogsTable from "../components/LogsTable";

export default function Logs() {

    return (
        <div className="flex flex-col gap-10">
            <h1 className="font-bold text-2xl">Logs</h1>
            <section>
              <LogsTable /> 
            </section>
        </div>
    )
}
