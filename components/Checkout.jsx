import Modal from "../components/UI/Modal";
import CartContext from "../store/CartContext";
import { currencyFormatter } from "../util/formatting";
import { useContext, useActionState } from "react";
import Input from "./UI/Input";
import Button from "./UI/Button";
import UserProgressContext from "../store/UserProgressContext";
import useHttp from "../hooks/useHttp";
import Error from "./Error";

const requestConfig = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}

export default function Checkout() {
    const cartCtx = useContext(CartContext);
    const userProgressCtx = useContext(UserProgressContext)

    const { data, error, sendRequest, clearData } = useHttp('http://localhost:3000/orders', requestConfig);

    const cartTotal = cartCtx.items.reduce((totalPrice, item) => totalPrice + item.price * item.quantity, 0);

    function handleClose() {
        userProgressCtx.hideCheckout();
    }

    async function checkoutAction(prevState, fd) {
        const customerData = Object.fromEntries(fd.entries());

        await sendRequest(
            JSON.stringify({
                order: {
                    items: cartCtx.items,
                    customer: customerData
                }
            })
        );
    }

    const [formState, formAction, isSending] = useActionState(checkoutAction, null)

    function handleFinish() {
        userProgressCtx.hideCheckout();
        cartCtx.clearCart();
        clearData();
    }

    let actions = (
        <>
            <Button type='button' textOnly onClick={handleClose} >关闭</Button>
            <Button>提交</Button>
        </>
    )

    if (isSending) {
        actions = <span>正在提交...</span>
    }

    if (data && !error) {
        return <Modal open={userProgressCtx.progress === 'checkout'} onClose={handleFinish}>
            <h2>成功提交</h2>
            <p>您的订单已成功提交</p>
            <p className="modal-actions">
                <Button onClick={handleFinish}>关闭</Button>
            </p>
        </Modal>
    }

    return (
        <Modal open={userProgressCtx.progress === 'checkout'} onClose={handleClose}>
            <form action={formAction}>
                <h2>结账</h2>
                <p>总计: {currencyFormatter.format(cartTotal)}</p>
                <Input label="姓名" type='text' id='name' />
                <Input label="邮箱" type='email' id='email' />
                <Input label="街道" type='text' id='street' />
                <div className="control-row">
                    <Input label='邮政编码' type='text' id='postal-code' />
                    <Input label='城市' type='text' id='city' />
                </div>

                {error && <Error title='当前无法提交' message={error} />}

                <p className='modal-actions'>
                    {actions}
                </p>
            </form>
        </Modal>
    )
}