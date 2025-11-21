import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default () => (
  
  <header className="flex flex-row justify-between pt-3 items-center">

    <Link to="/">
      <span className='text-2xl'>
        <span className='font-light'>Chonky</span><span className="font-extrabold">Prefect</span>
      </span>
    </Link>

    <div className="flex items-center space-x-2 w-80">
      <Input type="text" className="px-3 py-2 " placeholder="Single / for whole site. Double // for this page." />
    </div>

  <p>hey</p>

  </header>
);