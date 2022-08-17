import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
import { useContext } from "react";

import { NoticeContext } from "../components";
import Link from 'next/link';
import Image from 'next/image';
import logo from "../images/bear-8bit-transparent.png"
import useUser from '../lib/useUser';

const navigation = [
    { name: 'Dashboard', href: '/', current: true },
    { name: 'Organizations', href: '/orgs', current: false },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Layout({ children, title }: { children: JSX.Element, title: string }) {

    const { error } = useContext(NoticeContext);
    const { currentUser } = useUser();
    const user = currentUser.user;

    const userNavigation = currentUser.isLoggedIn ? [
        { name: 'Your Profile', href: `/users/${user!.username}` },
        { name: 'Sign out', href: '/logout' },
    ] : []

    return (
        <>
            <div className="min-h-full">
                <Disclosure as="nav" className="bg-gray-800">
                    {({ open }) => (
                        <>
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center justify-between h-16">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Image height={50} width={50} src={logo} alt="GitCloud" className='h-8 w-8' />
                                        </div>
                                        <div className="hidden md:block">
                                            <div className="ml-10 flex items-baseline space-x-4">
                                                {navigation.map((item) => (
                                                    <Link href={item.href} key={item.name}>
                                                        <a className={classNames(
                                                            item.current
                                                                ? 'bg-gray-900 text-white'
                                                                : 'hover:bg-gray-700 hover:text-white',
                                                            'px-3 py-2 rounded-md text-sm font-medium text-white'
                                                        )}
                                                            aria-current={item.current ? 'page' : undefined}
                                                        >
                                                            {item.name}
                                                        </a>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <div className="ml-4 flex items-center md:ml-6">
                                            {/* <button
                                                type="button"
                                                className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                            >
                                                <span className="sr-only">View notifications</span>
                                                <BellIcon className="h-6 w-6" aria-hidden="true" />
                                            </button> */}

                                            {/* Profile dropdown */}
                                            {
                                                currentUser.isLoggedIn ? (
                                                    <Menu as="div" className="ml-3 relative">
                                                        <div>
                                                            <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                                                                <span className="sr-only">Open user menu</span>
                                                                <Image className="h-8 w-8 rounded-full" alt="" src={''} />
                                                            </Menu.Button>
                                                        </div>
                                                        <Transition
                                                            as={Fragment}
                                                            enter="transition ease-out duration-100"
                                                            enterFrom="transform opacity-0 scale-95"
                                                            enterTo="transform opacity-100 scale-100"
                                                            leave="transition ease-in duration-75"
                                                            leaveFrom="transform opacity-100 scale-100"
                                                            leaveTo="transform opacity-0 scale-95"
                                                        >
                                                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                {userNavigation.map((item) => (
                                                                    <Menu.Item key={item.name}>
                                                                        {({ active }) => (
                                                                            <Link href={item.href}
                                                                                className={classNames(
                                                                                    active ? 'bg-gray-100' : '',
                                                                                    'block px-4 py-2 text-sm text-gray-700'
                                                                                )}
                                                                                key={item.name}
                                                                            >
                                                                                {item.name}
                                                                            </Link>
                                                                        )}
                                                                    </Menu.Item>
                                                                ))}
                                                            </Menu.Items>
                                                        </Transition>
                                                    </Menu>
                                                ) : (
                                                    <Link href="/login">
                                                        <a
                                                            className='text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'
                                                        >
                                                            Sign In
                                                        </a>
                                                    </Link>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className="-mr-2 flex md:hidden">
                                        {/* Mobile menu button */}
                                        <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                                            <span className="sr-only">Open main menu</span>
                                            {open ? (
                                                <XIcon className="block h-6 w-6" aria-hidden="true" />
                                            ) : (
                                                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                                            )}
                                        </Disclosure.Button>
                                    </div>
                                </div>
                            </div>

                            <Disclosure.Panel className="md:hidden">
                                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                    {navigation.map((item) => (
                                        <Link href={item.href} key={item.name}>
                                            <Disclosure.Button
                                                className={classNames(
                                                    item.current ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-700 hover:text-white',
                                                    'block px-3 py-2 rounded-md text-base font-medium'
                                                )}
                                                aria-current={item.current ? 'page' : undefined}
                                            >
                                                {item.name}
                                            </Disclosure.Button>
                                        </Link>
                                    ))}
                                </div>
                                <div className="pt-4 pb-3 border-t border-gray-700">
                                    <div className="flex items-center px-5">
                                        {/* <div className="flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full" src={user.imageUrl} alt="" />
                                        </div> */}
                                        {currentUser.isLoggedIn ? (<div className="ml-3">
                                            <div className="text-base font-medium text-white">{user!.name}</div>
                                            <div className="text-sm font-medium text-gray-400">{user!.email}</div>
                                        </div>) : (<>test</>)}

                                        <button
                                            type="button"
                                            className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                        >
                                            <span className="sr-only">View notifications</span>
                                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="mt-3 px-2 space-y-1">
                                        {userNavigation.map((item) => (
                                            <Link href={item.href} key={item.name}>
                                                <Disclosure.Button
                                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                                                >
                                                    {item.name}
                                                </Disclosure.Button>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>

                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-lg leading-6 font-semibold text-gray-900">{title || "GitCloud"}</h1>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </>
    )
}
