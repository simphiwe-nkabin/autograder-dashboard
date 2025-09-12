import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router-dom";
import logo from '../assets/shaper-logo.png'

export default function Header() {

    const { isAuthenticated, isLoading, loginWithRedirect, user, logout } = useAuth0()

    return (
        <header>
            <nav className='bg-gray-800 text-white py-2 px-3 md:py-4 md:px-5 flex justify-between'>
                <NavLink to="/" className='text- md:text-xl flex items-center gap-2'>
                    <img src={logo} className='w-5 md:w-6' alt="Shaper logo" />
                    Auto Grader
                </NavLink>
                <div>
                    {isAuthenticated ?
                        <div className='flex gap-5 items-center'>
                            <span className='text-xs hidden md:inline'>{user?.name}{' '}</span>
                            <button className='bg-blue-500 px-2 text-sm md:px-3 py-1' onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                                Log out
                            </button>
                        </div>
                        :
                        <button className='bg-blue-500 px-3 py-1' onClick={() => loginWithRedirect()}>Log in</button>}
                </div>
            </nav>
        </header>
    )
}
