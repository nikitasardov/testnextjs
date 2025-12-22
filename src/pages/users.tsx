import { withAuth } from "@/components/withAuth";

function Users() {
    return (
        <div>
            <h1>Users Page</h1>
        </div>
    )
}

export default withAuth(Users);