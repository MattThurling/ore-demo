import { NavLink } from "react-router"

function Nav() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">ORE</a>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><NavLink to='/id'>ID</NavLink></li>
          <li><NavLink to='/publish'>Publish</NavLink></li>
          <li><NavLink to='/share'>Share</NavLink></li>
          <li><NavLink to='/play'>Play</NavLink></li>
        </ul>
      </div>
    </div>
  )
}

export default Nav