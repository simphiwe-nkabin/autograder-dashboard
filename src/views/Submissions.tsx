import SubmissionsTable from "../components/SubmissionsTable";

export default function Submissions() {

    return (
        <div className="flex flex-col gap-10">
            <h1 className="font-semibold text-2xl">Submissions</h1>
            <section>
                <SubmissionsTable />
            </section>
        </div>
    )
}
