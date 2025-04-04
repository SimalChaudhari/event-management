PGDMP         #                }            event-management    15.1    15.1 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                        0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    207043    event-management    DATABASE     �   CREATE DATABASE "event-management" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
 "   DROP DATABASE "event-management";
                postgres    false            \           1247    216726 $   enum_EventRegistration_paymentStatus    TYPE     v   CREATE TYPE public."enum_EventRegistration_paymentStatus" AS ENUM (
    'Pending',
    'Completed',
    'Refunded'
);
 9   DROP TYPE public."enum_EventRegistration_paymentStatus";
       public          postgres    false            Y           1247    216721    enum_EventRegistration_role    TYPE     ^   CREATE TYPE public."enum_EventRegistration_role" AS ENUM (
    'Attendee',
    'Exhibitor'
);
 0   DROP TYPE public."enum_EventRegistration_role";
       public          postgres    false            V           1247    214870 %   enum_EventRegistrations_paymentStatus    TYPE     w   CREATE TYPE public."enum_EventRegistrations_paymentStatus" AS ENUM (
    'Pending',
    'Completed',
    'Refunded'
);
 :   DROP TYPE public."enum_EventRegistrations_paymentStatus";
       public          postgres    false            S           1247    214864    enum_EventRegistrations_role    TYPE     _   CREATE TYPE public."enum_EventRegistrations_role" AS ENUM (
    'Attendee',
    'Exhibitor'
);
 1   DROP TYPE public."enum_EventRegistrations_role";
       public          postgres    false            h           1247    219311    enum_Event_type    TYPE     P   CREATE TYPE public."enum_Event_type" AS ENUM (
    'Physical',
    'Virtual'
);
 $   DROP TYPE public."enum_Event_type";
       public          postgres    false            M           1247    208262    enum_Events_type    TYPE     Q   CREATE TYPE public."enum_Events_type" AS ENUM (
    'Physical',
    'Virtual'
);
 %   DROP TYPE public."enum_Events_type";
       public          postgres    false            e           1247    219224 $   enum_RegistraterEvents_paymentStatus    TYPE     v   CREATE TYPE public."enum_RegistraterEvents_paymentStatus" AS ENUM (
    'Pending',
    'Completed',
    'Refunded'
);
 9   DROP TYPE public."enum_RegistraterEvents_paymentStatus";
       public          postgres    false            b           1247    219219    enum_RegistraterEvents_role    TYPE     ^   CREATE TYPE public."enum_RegistraterEvents_role" AS ENUM (
    'Attendee',
    'Exhibitor'
);
 0   DROP TYPE public."enum_RegistraterEvents_role";
       public          postgres    false            P           1247    208439    enum_User_role    TYPE     I   CREATE TYPE public."enum_User_role" AS ENUM (
    'admin',
    'user'
);
 #   DROP TYPE public."enum_User_role";
       public          postgres    false            G           1247    207045    enum_Users_gender    TYPE     Z   CREATE TYPE public."enum_Users_gender" AS ENUM (
    'Male',
    'Female',
    'Other'
);
 &   DROP TYPE public."enum_Users_gender";
       public          postgres    false            J           1247    207063    enum_Users_role    TYPE     c   CREATE TYPE public."enum_Users_role" AS ENUM (
    'Admin',
    'User',
    'admin',
    'user'
);
 $   DROP TYPE public."enum_Users_role";
       public          postgres    false            �            1259    231584    Event    TABLE       CREATE TABLE public."Event" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "startDate" date NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endDate" date NOT NULL,
    "endTime" time without time zone NOT NULL,
    location character varying(255),
    type public."enum_Event_type",
    price numeric(10,2),
    currency character varying(10),
    "createdBy" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public."Event";
       public         heap    postgres    false    872            �            1259    231596    RegistraterEvents    TABLE     �  CREATE TABLE public."RegistraterEvents" (
    id uuid NOT NULL,
    "userId" uuid,
    "eventId" uuid,
    role public."enum_RegistraterEvents_role" DEFAULT 'Attendee'::public."enum_RegistraterEvents_role",
    "paymentStatus" public."enum_RegistraterEvents_paymentStatus" DEFAULT 'Completed'::public."enum_RegistraterEvents_paymentStatus",
    "invoiceUrl" text,
    "receiptUrl" text,
    "registeredAt" timestamp with time zone
);
 '   DROP TABLE public."RegistraterEvents";
       public         heap    postgres    false    866    869    869    866            �            1259    219041    User    TABLE     �  CREATE TABLE public."User" (
    id uuid NOT NULL,
    role public."enum_User_role" DEFAULT 'user'::public."enum_User_role" NOT NULL,
    "firstName" character varying(255) NOT NULL,
    "lastName" character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    mobile character varying(255),
    address character varying(255),
    city character varying(255),
    state character varying(255),
    "postalCode" character varying(255),
    "isMember" boolean DEFAULT false,
    "biometricEnabled" boolean DEFAULT false,
    "countryCurrency" character varying(10),
    "profilePicture" text,
    "linkedinProfile" text,
    "resetToken" character varying(255),
    "resetTokenExpiry" timestamp with time zone,
    "isVerify" boolean DEFAULT false,
    otp character varying(255),
    "otpExpiry" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public."User";
       public         heap    postgres    false    848    848            �          0    231584    Event 
   TABLE DATA           �   COPY public."Event" (id, name, description, "startDate", "startTime", "endDate", "endTime", location, type, price, currency, "createdBy", "createdAt", "updatedAt") FROM stdin;
    public          postgres    false    215   �       �          0    231596    RegistraterEvents 
   TABLE DATA           �   COPY public."RegistraterEvents" (id, "userId", "eventId", role, "paymentStatus", "invoiceUrl", "receiptUrl", "registeredAt") FROM stdin;
    public          postgres    false    216   w�       �          0    219041    User 
   TABLE DATA           2  COPY public."User" (id, role, "firstName", "lastName", email, password, mobile, address, city, state, "postalCode", "isMember", "biometricEnabled", "countryCurrency", "profilePicture", "linkedinProfile", "resetToken", "resetTokenExpiry", "isVerify", otp, "otpExpiry", "createdAt", "updatedAt") FROM stdin;
    public          postgres    false    214   M�       f           2606    231590    Event Event_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);
 >   ALTER TABLE ONLY public."Event" DROP CONSTRAINT "Event_pkey";
       public            postgres    false    215            h           2606    231604 (   RegistraterEvents RegistraterEvents_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public."RegistraterEvents"
    ADD CONSTRAINT "RegistraterEvents_pkey" PRIMARY KEY (id);
 V   ALTER TABLE ONLY public."RegistraterEvents" DROP CONSTRAINT "RegistraterEvents_pkey";
       public            postgres    false    216            �           2606    232908    User User_email_key 
   CONSTRAINT     S   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);
 A   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key";
       public            postgres    false    214            �           2606    232906    User User_email_key1 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key1" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key1";
       public            postgres    false    214            �           2606    232850    User User_email_key10 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key10" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key10";
       public            postgres    false    214            �           2606    232880    User User_email_key100 
   CONSTRAINT     V   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key100" UNIQUE (email);
 D   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key100";
       public            postgres    false    214            �           2606    232884    User User_email_key101 
   CONSTRAINT     V   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key101" UNIQUE (email);
 D   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key101";
       public            postgres    false    214            �           2606    232882    User User_email_key102 
   CONSTRAINT     V   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key102" UNIQUE (email);
 D   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key102";
       public            postgres    false    214            �           2606    232778    User User_email_key103 
   CONSTRAINT     V   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key103" UNIQUE (email);
 D   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key103";
       public            postgres    false    214            �           2606    232852    User User_email_key11 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key11" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key11";
       public            postgres    false    214            �           2606    232936    User User_email_key12 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key12" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key12";
       public            postgres    false    214            �           2606    232784    User User_email_key13 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key13" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key13";
       public            postgres    false    214            �           2606    232968    User User_email_key14 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key14" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key14";
       public            postgres    false    214            �           2606    232782    User User_email_key15 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key15" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key15";
       public            postgres    false    214            �           2606    232780    User User_email_key16 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key16" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key16";
       public            postgres    false    214            �           2606    232970    User User_email_key17 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key17" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key17";
       public            postgres    false    214            �           2606    232972    User User_email_key18 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key18" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key18";
       public            postgres    false    214            �           2606    232900    User User_email_key19 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key19" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key19";
       public            postgres    false    214            �           2606    232910    User User_email_key2 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key2" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key2";
       public            postgres    false    214            �           2606    232984    User User_email_key20 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key20" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key20";
       public            postgres    false    214            �           2606    232902    User User_email_key21 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key21" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key21";
       public            postgres    false    214            �           2606    232982    User User_email_key22 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key22" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key22";
       public            postgres    false    214            �           2606    232978    User User_email_key23 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key23" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key23";
       public            postgres    false    214            �           2606    232980    User User_email_key24 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key24" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key24";
       public            postgres    false    214            �           2606    232934    User User_email_key25 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key25" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key25";
       public            postgres    false    214            �           2606    232854    User User_email_key26 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key26" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key26";
       public            postgres    false    214            �           2606    232874    User User_email_key27 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key27" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key27";
       public            postgres    false    214            �           2606    232872    User User_email_key28 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key28" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key28";
       public            postgres    false    214            �           2606    232856    User User_email_key29 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key29" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key29";
       public            postgres    false    214            �           2606    232912    User User_email_key3 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key3" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key3";
       public            postgres    false    214            �           2606    232870    User User_email_key30 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key30" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key30";
       public            postgres    false    214            �           2606    232858    User User_email_key31 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key31" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key31";
       public            postgres    false    214            �           2606    232868    User User_email_key32 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key32" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key32";
       public            postgres    false    214            �           2606    232860    User User_email_key33 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key33" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key33";
       public            postgres    false    214            �           2606    232862    User User_email_key34 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key34" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key34";
       public            postgres    false    214            �           2606    232866    User User_email_key35 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key35" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key35";
       public            postgres    false    214            �           2606    232830    User User_email_key36 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key36" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key36";
       public            postgres    false    214            �           2606    232788    User User_email_key37 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key37" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key37";
       public            postgres    false    214            �           2606    232828    User User_email_key38 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key38" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key38";
       public            postgres    false    214            �           2606    232790    User User_email_key39 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key39" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key39";
       public            postgres    false    214            �           2606    232904    User User_email_key4 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key4" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key4";
       public            postgres    false    214            �           2606    232826    User User_email_key40 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key40" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key40";
       public            postgres    false    214            �           2606    232800    User User_email_key41 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key41" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key41";
       public            postgres    false    214            �           2606    232802    User User_email_key42 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key42" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key42";
       public            postgres    false    214            �           2606    232804    User User_email_key43 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key43" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key43";
       public            postgres    false    214            �           2606    232864    User User_email_key44 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key44" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key44";
       public            postgres    false    214            �           2606    232824    User User_email_key45 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key45" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key45";
       public            postgres    false    214            �           2606    232806    User User_email_key46 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key46" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key46";
       public            postgres    false    214            �           2606    232810    User User_email_key47 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key47" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key47";
       public            postgres    false    214            �           2606    232808    User User_email_key48 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key48" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key48";
       public            postgres    false    214            �           2606    232966    User User_email_key49 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key49" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key49";
       public            postgres    false    214            �           2606    232844    User User_email_key5 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key5" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key5";
       public            postgres    false    214            �           2606    232938    User User_email_key50 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key50" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key50";
       public            postgres    false    214            �           2606    232964    User User_email_key51 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key51" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key51";
       public            postgres    false    214            �           2606    232946    User User_email_key52 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key52" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key52";
       public            postgres    false    214            �           2606    232940    User User_email_key53 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key53" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key53";
       public            postgres    false    214                        2606    232942    User User_email_key54 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key54" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key54";
       public            postgres    false    214                       2606    232944    User User_email_key55 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key55" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key55";
       public            postgres    false    214                       2606    232932    User User_email_key56 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key56" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key56";
       public            postgres    false    214                       2606    232892    User User_email_key57 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key57" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key57";
       public            postgres    false    214                       2606    232894    User User_email_key58 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key58" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key58";
       public            postgres    false    214            
           2606    232930    User User_email_key59 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key59" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key59";
       public            postgres    false    214                       2606    232832    User User_email_key6 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key6" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key6";
       public            postgres    false    214                       2606    232896    User User_email_key60 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key60" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key60";
       public            postgres    false    214                       2606    232898    User User_email_key61 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key61" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key61";
       public            postgres    false    214                       2606    232798    User User_email_key62 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key62" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key62";
       public            postgres    false    214                       2606    232792    User User_email_key63 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key63" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key63";
       public            postgres    false    214                       2606    232796    User User_email_key64 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key64" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key64";
       public            postgres    false    214                       2606    232794    User User_email_key65 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key65" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key65";
       public            postgres    false    214                       2606    232842    User User_email_key66 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key66" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key66";
       public            postgres    false    214                       2606    232914    User User_email_key67 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key67" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key67";
       public            postgres    false    214                       2606    232840    User User_email_key68 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key68" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key68";
       public            postgres    false    214                        2606    232838    User User_email_key69 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key69" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key69";
       public            postgres    false    214            "           2606    232786    User User_email_key7 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key7" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key7";
       public            postgres    false    214            $           2606    232916    User User_email_key70 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key70" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key70";
       public            postgres    false    214            &           2606    232836    User User_email_key71 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key71" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key71";
       public            postgres    false    214            (           2606    232834    User User_email_key72 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key72" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key72";
       public            postgres    false    214            *           2606    232918    User User_email_key73 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key73" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key73";
       public            postgres    false    214            ,           2606    232920    User User_email_key74 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key74" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key74";
       public            postgres    false    214            .           2606    232822    User User_email_key75 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key75" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key75";
       public            postgres    false    214            0           2606    232812    User User_email_key76 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key76" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key76";
       public            postgres    false    214            2           2606    232820    User User_email_key77 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key77" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key77";
       public            postgres    false    214            4           2606    232818    User User_email_key78 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key78" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key78";
       public            postgres    false    214            6           2606    232814    User User_email_key79 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key79" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key79";
       public            postgres    false    214            8           2606    232846    User User_email_key8 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key8" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key8";
       public            postgres    false    214            :           2606    232816    User User_email_key80 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key80" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key80";
       public            postgres    false    214            <           2606    232962    User User_email_key81 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key81" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key81";
       public            postgres    false    214            >           2606    232948    User User_email_key82 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key82" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key82";
       public            postgres    false    214            @           2606    232960    User User_email_key83 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key83" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key83";
       public            postgres    false    214            B           2606    232958    User User_email_key84 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key84" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key84";
       public            postgres    false    214            D           2606    232950    User User_email_key85 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key85" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key85";
       public            postgres    false    214            F           2606    232956    User User_email_key86 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key86" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key86";
       public            postgres    false    214            H           2606    232952    User User_email_key87 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key87" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key87";
       public            postgres    false    214            J           2606    232954    User User_email_key88 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key88" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key88";
       public            postgres    false    214            L           2606    232976    User User_email_key89 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key89" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key89";
       public            postgres    false    214            N           2606    232848    User User_email_key9 
   CONSTRAINT     T   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key9" UNIQUE (email);
 B   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key9";
       public            postgres    false    214            P           2606    232922    User User_email_key90 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key90" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key90";
       public            postgres    false    214            R           2606    232974    User User_email_key91 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key91" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key91";
       public            postgres    false    214            T           2606    232928    User User_email_key92 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key92" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key92";
       public            postgres    false    214            V           2606    232924    User User_email_key93 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key93" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key93";
       public            postgres    false    214            X           2606    232926    User User_email_key94 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key94" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key94";
       public            postgres    false    214            Z           2606    232890    User User_email_key95 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key95" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key95";
       public            postgres    false    214            \           2606    232876    User User_email_key96 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key96" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key96";
       public            postgres    false    214            ^           2606    232888    User User_email_key97 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key97" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key97";
       public            postgres    false    214            `           2606    232878    User User_email_key98 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key98" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key98";
       public            postgres    false    214            b           2606    232886    User User_email_key99 
   CONSTRAINT     U   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key99" UNIQUE (email);
 C   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_email_key99";
       public            postgres    false    214            d           2606    219051    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public            postgres    false    214            i           2606    232991    Event Event_createdBy_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON DELETE SET NULL;
 H   ALTER TABLE ONLY public."Event" DROP CONSTRAINT "Event_createdBy_fkey";
       public          postgres    false    215    214    3428            j           2606    233001 0   RegistraterEvents RegistraterEvents_eventId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."RegistraterEvents"
    ADD CONSTRAINT "RegistraterEvents_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public."RegistraterEvents" DROP CONSTRAINT "RegistraterEvents_eventId_fkey";
       public          postgres    false    216    215    3430            k           2606    232996 /   RegistraterEvents RegistraterEvents_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."RegistraterEvents"
    ADD CONSTRAINT "RegistraterEvents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
 ]   ALTER TABLE ONLY public."RegistraterEvents" DROP CONSTRAINT "RegistraterEvents_userId_fkey";
       public          postgres    false    214    216    3428            �   W  x��VMo�6=K�����?r�&��v�E���@/E�Ddɐd���Zr,�u/��4ç��SVi�,��TXǱ����[�$�GZ�~�w�M#L�m�s!�vM��|��Ї����5Jm���5�ա��&SY{C��b��f�=�&����i�+���}h��;�}�}�:$Y��~�/�v�rNpMk��6[�"&TV�XU���qL	��F�bV��_�������'�r56�X(@��$
{����r�i��*@��Ø�'��럇u�-��Ν�>��[�qcxJa@/ǓS3RP�O0M15Ǿvm�|��À>�2Tؕ�W C�Jы�,���V�(VJ,�&P�XQ����Ȋ��im��>��E��&c���vm�6@������s
Z(�9#�XmM��I��{��k	��y	�e����5u+K�V�Y_������ƹX�~A_ڶۻ��~�)>��m�>ӣr#�C B[O���qx�)�ȚZ�b*kj���_;tP�w`�BB�JD�\Y�/!�̖��T)p�����yl9	RF[�����Jn�q@p���>�B*K�e���=�m�c�or�����=��3���1��1 !S����:@�\1N/�̖��(���a�*������(�T!�7��|t���S���jN���\��n����AxĜ�b*kh���*�N�� q��$_q}�[��RQ;���p�e࿊[Д�-	�ɋ��>�]���x���R�*#�a|����=������@����>�L�$�����1�mx�Vc��]�A���m�:�2[W���γ���h^93�2y�-�;.�7�J/lq���x6�����o�0���P5��c�5�f(H*�%2��9�>�m�t���IT_�Y��r�E��:��D���0����$��'�zy�����q�����Ym�q�.����Am���9c֌��������#��6��_�:fyT�Kvt�-+B<	��N�JF�`L��`�G��q�y ��UoY���=��8�26	��a<8�9�&t^ߜh��ӎ�kxA�b4�K��{X���D�Z�1���"����UY�� �)�      �   �  x������1F뙧H1��L�����r+��o���+Er����(5+�^����p�fD3���MXVm�����<E�`�s�qc�55Հ>Ad0D� Y���
�t���R�������??������i�: �'�g�'ڃ�}��d�g�Y�t��$D`8tI^n�n���N,��}��訰��������\�(��G��(����M��9�au�2V��2@UOQ3��3�a<����2�?���F������N�`na(����Ȋ��c�Aѱ~fy��h0���rվ�7%ǣ���#Mgp��=`���s��ؒ�Q.�L4A�&�8֫Y�-t��Pv}�ڻ�I��g]�S 5�in�.�Y�(w��v~��U0g[������:e<El�F9�Dט`���;��Jc;����5�r��t�v��e�>qL"&C��(O(�I� yw��q����(]      �   �  x���Is����Wxq������UH��)@�P��e9<�ȯo��g ]�[��lɯ�G�70_iy�Kt�LR�P(W�H�O}��-M������|��8�:O�7|��ۓF�5O�7�ns��ڎ;�֧y1_L��^1�g�i3�2�<l�~�0��{B��8t�?�mE�W��TU��}�ϟ������ �]D]�9�_Rv�Ĉ��	�]�z�wRkH�XjL\�u���2A�U��i�y<:�N�� fqR�0�	|9G�b0S����*»ܣ�ۼ�`���~��m��*k���*��,�W*�g�`�K0���	U�tUf@;ߖ�]rb��B ���`f��%�K�+�sj�Q�MD#�
d\�u�Jd���R��O0nUjJ0Q�$/��8��9�arh_\=����z��Ӿ��-a/��Ȥ�����0I��n<�_��x'a� �c�2O�g��*c�Se���n��J���_c������c!3X/*t��b��#��0�4b'&cU�%�͗��!�qW�S��7��f?{��D
��6�f}�v�Fr=��c�D�������`���Mb�f���SϞLbϤ��8ʋ,V�G_�
��z�;��g���Г��=D\f8r�@HG6�t���̉K7.h�B�-%v��AYo�,� 6_��^��j������.�7���6��.���e~�S�_��n 9q���i�ۢc��*1`��e�=M�˯ڄ"�)��&?�5�&DyV�&��i��3���qܚ,��#c��}�sLvϝ�a�k���n�;�a�h���qH[i��(�qs$F�H��c;
e��=�� �?gd<O�d�2�P��K����%8Ŀ�"r>����,��?"��D���]b�G���NpFy`���l��Y�6��96�n��~�5�ð�Ɇ}HFPd�yg1�O���H�nW��:~�8���B	 �s���dN}g��M��좍��4�@"�E$A�}��G��h`��ȕ�c.�� 8�����H鿧��RI^�J8��4+�?�����O�L��]v;�N�l]�d�X�s��;�_��&]�O��zѝ��U��{M��B�Fq(+�|T�J*렵9���f:��e"�����X
Pp�|@�/�5{�!��x�G�ۚ��ԮzX��Fʧ���֌�Ҏ�i�Yf+�>>��9zwk_;جW�q<i<%�pA��p�xl-�GO[�D�_.���7��P�� �w|�1��5��)�zq���m�;�˼R�s�<BA�wx�C�>)Z�j-$�z�6~-A�m����vU���5��g3�MU^�4V��6�ׇ�޲a�N�^� �w0h��)ĭ�`*�n�%I���-4��<t �G����hc3ө�sTݮ���G�#?�����lE�P��3o��7j�r��1En�C�2!��3�F���^�*L���k���?��o1��t���c`�x=�-[�\b	%�pΟ�V���dQ     