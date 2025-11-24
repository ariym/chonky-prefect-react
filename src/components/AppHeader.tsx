import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";

const PREFECT_DASHBOARD_URL = import.meta.env.VITE_PREFECT_DASHBOARD_URL;

const NavMenu = () => (
  <div>
    <a target="_blank" href={PREFECT_DASHBOARD_URL}>
      <span className="mr-5">Prefect-Dashboard</span>
    </a>
    <Link to="/jobs">
      <span>Jobs</span>
    </Link>
  </div>
);

export default () => (

  <header className="flex flex-row justify-between p-3 items-center">

    <Link to="/">
      <span className='text-2xl'>
        <span className='font-light'>Media</span><span className="font-extrabold">Processor</span>
      </span>
    </Link>

    <NavMenu />

  </header>
);