"use client"
import React from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation';

export default function SignUp() {

    const { data, error } = await authClient.signUp.email({
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name
        image, // User image URL (optional)
    }, {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
            // display the error message
            alert(ctx.error.message);
        },
    });

    return (
        <div>
            <h1 className='text-white text-3xl'>SignUp</h1>
        </div>
    )
}
