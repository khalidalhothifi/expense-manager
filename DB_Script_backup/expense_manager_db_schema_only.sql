--
-- PostgreSQL database dump
--

\restrict ywzKSfYmQL2y1aC5R1d8EcOrwCRLKP3oQyjsnJdXjJgTYYC7YBQJOoBcxT5Pth8

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-11-21 10:30:16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16862)
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id character varying(50) NOT NULL,
    vendor character varying(255) NOT NULL,
    invoice_number character varying(100),
    date date NOT NULL,
    line_items jsonb NOT NULL,
    tax numeric(10,2) DEFAULT 0.00,
    total numeric(12,2) NOT NULL,
    notes text,
    category character varying(100),
    status character varying(50) NOT NULL,
    submitted_by character varying(50) NOT NULL,
    responsibility_id character varying(50) NOT NULL,
    attachment jsonb,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16850)
-- Name: financial_responsibilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_responsibilities (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    budget numeric(12,2) NOT NULL,
    model character varying(50) NOT NULL,
    assignee jsonb NOT NULL,
    distributed_allocations jsonb,
    history text[],
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.financial_responsibilities OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16831)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    member_ids jsonb NOT NULL,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17294)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(50) NOT NULL,
    value jsonb NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16817)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    password_hash text NOT NULL,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16841)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 4895 (class 2606 OID 16877)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 16861)
-- Name: financial_responsibilities financial_responsibilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_responsibilities
    ADD CONSTRAINT financial_responsibilities_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 16840)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 17302)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- TOC entry 4883 (class 2606 OID 16830)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4885 (class 2606 OID 16828)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16849)
-- Name: vendors vendors_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_name_key UNIQUE (name);


--
-- TOC entry 4891 (class 2606 OID 16847)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 16883)
-- Name: expenses expenses_responsibility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_responsibility_id_fkey FOREIGN KEY (responsibility_id) REFERENCES public.financial_responsibilities(id);


--
-- TOC entry 4899 (class 2606 OID 16878)
-- Name: expenses expenses_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


-- Completed on 2025-11-21 10:30:16

--
-- PostgreSQL database dump complete
--

\unrestrict ywzKSfYmQL2y1aC5R1d8EcOrwCRLKP3oQyjsnJdXjJgTYYC7YBQJOoBcxT5Pth8

