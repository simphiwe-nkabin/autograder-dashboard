import ReportsTable from "../components/ReportsTable";



export default function Reports() {

    return (
        <div className="flex flex-col gap-10">
            <h1 className="font-semibold text-2xl">Reports</h1>
            <section>
                <ReportsTable />
            </section>
        </div>
    )
}