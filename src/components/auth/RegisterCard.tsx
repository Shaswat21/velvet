import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"

export default function RegisterCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Register your account</CardTitle>
        <CardDescription>
          Enter your details below to register your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="fname">First Name</Label>
              <Input id="fname" placeholder="John" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lname">Last Name</Label>
              <Input id="lname" placeholder="Doe" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpassword">Confirm Password</Label>
            <Input id="cpassword" type="password" required />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button className="w-full">Register</Button>

        <CardAction className="text-sm">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Login
          </Link>
        </CardAction>
      </CardFooter>
    </Card>
  )
}
